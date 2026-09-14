const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  addRack: async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkRack = await prisma.rack.findFirst({
        where: {
          name: name,
          status: "use",
        },
      });

      if (checkRack) {
        return res.status(400).send({ message: "rack_name_already" });
      }

      const createRack = await prisma.rack.create({
        data: {
          name: name,
        },
      });

      return res.send({
        message: "add_rack_success",
        data: createRack,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  addArea: async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkArea = await prisma.area.findFirst({
        where: {
          name: name,
          status: "use",
        },
      });

      if (checkArea) {
        return res.status(400).send({ message: "area_name_already" });
      }

      const createArea = await prisma.area.create({
        data: {
          name: name,
        },
      });

      return res.send({
        message: "add_area_success",
        data: createArea,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  mapAreaRack: async (req, res) => {
    try {
      const { rackId, areaId } = req.body;

      if (rackId == null || areaId == null) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkMapAreaRack = await prisma.mapAreaRack.findFirst({
        where: {
          rackId: parseInt(rackId),
          areaId: parseInt(areaId),
          status: "use",
        },
      });

      if (checkMapAreaRack) {
        return res.status(400).send({ message: "Map_areaRack_already" });
      }

      const createMapAreaRack = await prisma.mapAreaRack.create({
        data: {
          rackId: parseInt(rackId),
          areaId: parseInt(areaId),
        },
      });

      return res.send({
        message: "add_area_success",
        data: createMapAreaRack,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  mapAreaRackTwo: async (req, res) => {
    try {
      const { rackId, areaIdStart, areaIdEnd } = req.body;

      /* =========================
           VALIDATE
        ========================= */

      if (rackId == null || areaIdStart == null || areaIdEnd == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const rackIdNumber = parseInt(rackId);
      const start = parseInt(areaIdStart);
      const end = parseInt(areaIdEnd);

      if (
        Number.isNaN(rackIdNumber) ||
        Number.isNaN(start) ||
        Number.isNaN(end)
      ) {
        return res.status(400).send({
          message: "invalid_number",
        });
      }

      if (start > end) {
        return res.status(400).send({
          message: "areaIdStart_must_less_than_or_equal_areaIdEnd",
        });
      }

      /* =========================
           CREATE AREA ID LIST
        ========================= */

      const areaIds = [];

      for (let areaId = start; areaId <= end; areaId++) {
        areaIds.push(areaId);
      }

      /* =========================
           CHECK EXISTING
        ========================= */

      const existingRows = await prisma.mapAreaRack.findMany({
        where: {
          rackId: rackIdNumber,

          areaId: {
            in: areaIds,
          },

          status: "use",
        },

        select: {
          areaId: true,
        },
      });

      const existingAreaIds = new Set(
        existingRows.map((row) => Number(row.areaId))
      );

      /* =========================
           FILTER ONLY NEW DATA
        ========================= */

      const createRows = areaIds
        .filter((areaId) => !existingAreaIds.has(areaId))
        .map((areaId) => ({
          rackId: rackIdNumber,
          areaId: areaId,
        }));

      /* =========================
           CREATE
        ========================= */

      let createdCount = 0;

      if (createRows.length > 0) {
        const result = await prisma.mapAreaRack.createMany({
          data: createRows,
        });

        createdCount = result.count || 0;
      }

      /* =========================
           RESPONSE
        ========================= */

      return res.send({
        message: "add_area_success",

        rackId: rackIdNumber,

        areaIdStart: start,
        areaIdEnd: end,

        totalRequested: areaIds.length,

        createdCount: createdCount,

        skippedCount: existingAreaIds.size,

        existingAreaIds: Array.from(existingAreaIds),
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  list: async (req, res) => {
    try {
      const racks = await prisma.rack.findMany({
        where: {
          status: "use",
        },

        orderBy: {
          id: "asc",
        },

        include: {
          MapAreaRack: {
            where: {
              status: "use",
              Area: {
                status: "use",
              },
            },

            orderBy: {
              areaId: "asc",
            },

            include: {
              Area: true,
            },
          },
        },
      });

      const results = racks.map((rack) => ({
        rackId: rack.id,
        rackName: rack.name,

        areas: rack.MapAreaRack.map((map) => ({
          mapAreaRackId: map.id,
          areaId: map.Area.id,
          areaName: map.Area.name,
        })),
      }));

      return res.send({
        results: results,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  maplocationPallet: async (req, res) => {
    try {
      // =====================================================
      // CONFIG
      // =====================================================

      const CHUNK_SIZE = 500;

      // =====================================================
      // RESULT
      // =====================================================

      const results = [];

      // =====================================================
      // CURSOR
      // =====================================================

      let lastMapAreaRackId = 0;

      // =====================================================
      // SUMMARY
      // =====================================================

      let occupiedCount = 0;

      let emptyCount = 0;

      let duplicateLocationCount = 0;

      // =====================================================
      // LOOP MAP AREA RACK
      // =====================================================

      while (true) {
        // ===================================================
        // 1. LOAD MAP AREA RACK ทีละ 500
        // ===================================================

        const mapAreaRackChunk = await prisma.mapAreaRack.findMany({
          where: {
            id: {
              gt: lastMapAreaRackId,
            },

            status: "use",

            Rack: {
              status: "use",
            },

            Area: {
              status: "use",
            },
          },

          select: {
            id: true,

            rackId: true,

            areaId: true,

            status: true,

            Rack: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },

            Area: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },

          take: CHUNK_SIZE,
        });

        // ===================================================
        // หมดแล้ว
        // ===================================================

        if (mapAreaRackChunk.length === 0) {
          break;
        }

        // ===================================================
        // 2. MAP AREA RACK IDS
        // ===================================================

        const mapAreaRackIds = mapAreaRackChunk.map((row) => Number(row.id));

        // ===================================================
        // 3. LOAD PALLET ของ LOCATION ชุดนี้
        // ===================================================

        const pallets = [];

        // ใช้ cursor เพื่อกันกรณี Pallet ต่อ Location เยอะ
        // และป้องกัน query result ใหญ่เกินไป

        let lastPalletId = 0;

        while (true) {
          const palletChunk = await prisma.pallet.findMany({
            where: {
              mapAreaRackId: {
                in: mapAreaRackIds,
              },

              id: {
                gt: lastPalletId,
              },
            },

            select: {
              id: true,

              palletNoId: true,

              date: true,

              shift: true,

              mapAreaRackId: true,

              labelType: true,

              userId: true,

              timeStmp: true,
            },

            orderBy: {
              id: "asc",
            },

            take: CHUNK_SIZE,
          });

          if (palletChunk.length === 0) {
            break;
          }

          pallets.push(...palletChunk);

          lastPalletId = Number(palletChunk[palletChunk.length - 1].id);
        }

        // ===================================================
        // 4. GROUP PALLET BY MAP AREA RACK ID
        // ===================================================

        const palletByMapAreaRackId = new Map();

        for (const pallet of pallets) {
          const mapAreaRackId = Number(pallet.mapAreaRackId);

          if (!palletByMapAreaRackId.has(mapAreaRackId)) {
            palletByMapAreaRackId.set(mapAreaRackId, []);
          }

          palletByMapAreaRackId.get(mapAreaRackId).push(pallet);
        }

        // ===================================================
        // 5. BUILD RESULT
        // ===================================================

        for (const location of mapAreaRackChunk) {
          const mapAreaRackId = Number(location.id);

          const locationPallets =
            palletByMapAreaRackId.get(mapAreaRackId) || [];

          // =================================================
          // NEWEST PALLET FIRST
          // =================================================

          locationPallets.sort((a, b) => Number(b.id) - Number(a.id));

          const palletCount = locationPallets.length;

          const isOccupied = palletCount > 0;

          const isEmpty = !isOccupied;

          const rackName = String(location.Rack?.name || "").trim();

          const areaName = String(location.Area?.name || "").trim();

          const locationName = `${rackName}${areaName}`;

          // =================================================
          // SUMMARY
          // =================================================

          if (isOccupied) {
            occupiedCount++;
          } else {
            emptyCount++;
          }

          if (palletCount > 1) {
            duplicateLocationCount++;
          }

          // =================================================
          // CURRENT / LATEST PALLET
          // =================================================

          const latestPallet =
            locationPallets.length > 0 ? locationPallets[0] : null;

          // =================================================
          // PUSH RESULT
          // =================================================

          results.push({
            // ===============================================
            // LOCATION
            // ===============================================

            mapAreaRackId: mapAreaRackId,

            rackId: Number(location.rackId),

            areaId: Number(location.areaId),

            rackName: rackName,

            areaName: areaName,

            locationName: locationName,

            // ===============================================
            // STATUS
            // ===============================================

            isOccupied: isOccupied,

            isEmpty: isEmpty,

            palletCount: palletCount,

            // ===============================================
            // LATEST PALLET
            // ===============================================

            palletId: latestPallet ? Number(latestPallet.id) : null,

            palletNoId: latestPallet ? latestPallet.palletNoId : null,

            // ===============================================
            // ALL PALLET IN LOCATION
            // ===============================================

            pallets: locationPallets.map((pallet) => ({
              id: Number(pallet.id),

              palletNoId: pallet.palletNoId,

              date: pallet.date,

              shift: pallet.shift,

              mapAreaRackId: Number(pallet.mapAreaRackId),

              labelType: pallet.labelType,

              userId: Number(pallet.userId),

              timeStmp: pallet.timeStmp,
            })),
          });
        }

        // ===================================================
        // 6. NEXT MAP AREA RACK CHUNK
        // ===================================================

        lastMapAreaRackId = Number(
          mapAreaRackChunk[mapAreaRackChunk.length - 1].id
        );
      }

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.send({
        message: "map_location_pallet_success",

        summary: {
          totalLocation: results.length,

          occupied: occupiedCount,

          empty: emptyCount,

          duplicateLocation: duplicateLocationCount,
        },

        results: results,
      });
    } catch (e) {
      console.error("MAP LOCATION PALLET ERROR:", e);

      return res.status(500).send({
        message: "map_location_pallet_error",

        error: e.message,
      });
    }
  },
};
