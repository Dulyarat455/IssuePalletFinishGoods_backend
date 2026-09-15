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

  mapLocationPallet: async (req, res) => {
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

  mapLocationPalletBox: async (req, res) => {
    try {
  
      const CHUNK_SIZE = 500;
  
      const results = [];
  
      let lastMapAreaRackId = 0;
  
      // =====================================================
      // SUMMARY
      // =====================================================
  
      let totalLocation = 0;
      let occupiedLocation = 0;
      let emptyLocation = 0;
  
      let totalPallet = 0;
      let totalHeader = 0;
      let totalBox = 0;
      let totalFullBox = 0;
      let totalPartialBox = 0;
      let totalQty = 0;
  
  
      // =====================================================
      // LOOP LOCATION
      // =====================================================
  
      while (true) {
  
        // ===================================================
        // 1. MAP AREA RACK
        // ===================================================
  
        const mapAreaRackChunk =
          await prisma.mapAreaRack.findMany({
  
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
  
              Rack: {
                select: {
                  id: true,
                  name: true,
                },
              },
  
              Area: {
                select: {
                  id: true,
                  name: true,
                },
              },
  
            },
  
            orderBy: {
              id: "asc",
            },
  
            take: CHUNK_SIZE,
  
          });
  
  
        if (mapAreaRackChunk.length === 0) {
          break;
        }
  
  
        // ===================================================
        // LOCATION IDS
        // ===================================================
  
        const mapAreaRackIds =
          mapAreaRackChunk.map(
            (row) => Number(row.id)
          );
  
  
        // ===================================================
        // 2. PALLET
        // ===================================================
  
        const pallets = [];
  
        let lastPalletId = 0;
  
  
        while (true) {
  
          const palletChunk =
            await prisma.pallet.findMany({
  
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
  
                User: {
  
                  select: {
  
                    id: true,
  
                    empNo: true,
  
                    name: true,
  
                    role: true,
  
                  },
  
                },
  
              },
  
              orderBy: {
                id: "asc",
              },
  
              take: CHUNK_SIZE,
  
            });
  
  
          if (palletChunk.length === 0) {
            break;
          }
  
  
          pallets.push(
            ...palletChunk
          );
  
  
          lastPalletId =
            Number(
              palletChunk[
                palletChunk.length - 1
              ].id
            );
  
        }
  
  
        // ===================================================
        // PALLET IDS
        // ===================================================
  
        const palletIds =
          pallets.map(
            (row) => Number(row.id)
          );
  
  
        // ===================================================
        // 3. HEADER ISSUE
        // ===================================================
  
        const headers = [];
  
  
        for (
          let i = 0;
          i < palletIds.length;
          i += CHUNK_SIZE
        ) {
  
          const palletIdChunk =
            palletIds.slice(
              i,
              i + CHUNK_SIZE
            );
  
  
          let lastHeaderId = 0;
  
  
          while (true) {
  
            const headerChunk =
              await prisma.headerIssue.findMany({
  
                where: {
  
                  palletId: {
                    in: palletIdChunk,
                  },
  
                  status: "use",
  
                  id: {
                    gt: lastHeaderId,
                  },
  
                },
  
                select: {
  
                  id: true,
  
                  labelNo: true,
  
                  palletId: true,
  
                  itemNo: true,
  
                  itemName: true,
  
                  normalQty: true,
  
                  fractionQty: true,
  
                  groupId: true,
  
                  controlLot: true,
  
                  moveMentThreeMonth: true,
  
                  userId: true,
  
                  timeStmp: true,
  
                },
  
                orderBy: {
                  id: "asc",
                },
  
                take: CHUNK_SIZE,
  
              });
  
  
            if (headerChunk.length === 0) {
              break;
            }
  
  
            headers.push(
              ...headerChunk
            );
  
  
            lastHeaderId =
              Number(
                headerChunk[
                  headerChunk.length - 1
                ].id
              );
  
          }
  
        }
  
  
        // ===================================================
        // HEADER IDS
        // ===================================================
  
        const headerIds =
          headers.map(
            (row) => Number(row.id)
          );
  
  
        // ===================================================
        // 4. BOX
        // ===================================================
  
        const boxes = [];
  
  
        for (
          let i = 0;
          i < headerIds.length;
          i += CHUNK_SIZE
        ) {
  
          const headerIdChunk =
            headerIds.slice(
              i,
              i + CHUNK_SIZE
            );
  
  
          let lastBoxId = 0;
  
  
          while (true) {
  
            const boxChunk =
              await prisma.box.findMany({
  
                where: {
  
                  headerId: {
                    in: headerIdChunk,
                  },
  
                  status: "use",
  
                  id: {
                    gt: lastBoxId,
                  },
  
                },
  
                select: {
  
                  id: true,
  
                  headerId: true,
  
                  headerClosedId: true,
  
                  itemNo: true,
  
                  itemName: true,
  
                  wosNo: true,
  
                  dwg: true,
  
                  dieNo: true,
  
                  lotNo: true,
  
                  qty: true,
  
                  timeStmp: true,
  
                  status: true,
  
                },
  
                orderBy: {
                  id: "asc",
                },
  
                take: CHUNK_SIZE,
  
              });
  
  
            if (boxChunk.length === 0) {
              break;
            }
  
  
            boxes.push(
              ...boxChunk
            );
  
  
            lastBoxId =
              Number(
                boxChunk[
                  boxChunk.length - 1
                ].id
              );
  
          }
  
        }
  
  
        // ===================================================
        // BOX IDS
        // ===================================================
  
        const boxIds =
          boxes.map(
            (row) => Number(row.id)
          );
  
  
        // ===================================================
        // 5. FRACTION MAP
        //
        // Box ที่อยู่ใน MapHeaderIssueFraction
        // = PARTIAL
        //
        // Box ที่ไม่อยู่
        // = FULL
        // ===================================================
  
        const fractionMaps = [];
  
  
        for (
          let i = 0;
          i < boxIds.length;
          i += CHUNK_SIZE
        ) {
  
          const boxIdChunk =
            boxIds.slice(
              i,
              i + CHUNK_SIZE
            );
  
  
          if (boxIdChunk.length === 0) {
            continue;
          }
  
  
          const fractionChunk =
            await prisma.mapHeaderIssueFraction.findMany({
  
              where: {
  
                boxId: {
                  in: boxIdChunk,
                },
  
                status: "use",
  
              },
  
              select: {
  
                id: true,
  
                headerId: true,
  
                boxId: true,
  
                timeStmp: true,
  
              },
  
            });
  
  
          fractionMaps.push(
            ...fractionChunk
          );
  
        }
  
  
        // ===================================================
        // FRACTION BOX SET
        // ===================================================
  
        const fractionBoxIdSet =
          new Set(
            fractionMaps.map(
              (row) => Number(row.boxId)
            )
          );
  
  
        // ===================================================
        // 6. GROUP BOX BY HEADER
        // ===================================================
  
        const boxesByHeaderId =
          new Map();
  
  
        for (const box of boxes) {
  
          const headerId =
            Number(box.headerId);
  
  
          if (
            !boxesByHeaderId.has(
              headerId
            )
          ) {
  
            boxesByHeaderId.set(
              headerId,
              []
            );
  
          }
  
  
          boxesByHeaderId
            .get(headerId)
            .push(box);
  
        }
  
  
        // ===================================================
        // 7. GROUP HEADER BY PALLET
        // ===================================================
  
        const headersByPalletId =
          new Map();
  
  
        for (const header of headers) {
  
          const palletId =
            Number(header.palletId);
  
  
          if (
            !headersByPalletId.has(
              palletId
            )
          ) {
  
            headersByPalletId.set(
              palletId,
              []
            );
  
          }
  
  
          headersByPalletId
            .get(palletId)
            .push(header);
  
        }
  
  
        // ===================================================
        // 8. GROUP PALLET BY LOCATION
        // ===================================================
  
        const palletsByLocationId =
          new Map();
  
  
        for (const pallet of pallets) {
  
          const locationId =
            Number(
              pallet.mapAreaRackId
            );
  
  
          if (
            !palletsByLocationId.has(
              locationId
            )
          ) {
  
            palletsByLocationId.set(
              locationId,
              []
            );
  
          }
  
  
          palletsByLocationId
            .get(locationId)
            .push(pallet);
  
        }
  
  
        // ===================================================
        // 9. BUILD LOCATION RESULT
        // ===================================================
  
        for (
          const location of
          mapAreaRackChunk
        ) {
  
          const mapAreaRackId =
            Number(location.id);
  
  
          const rackName =
            String(
              location.Rack?.name || ""
            ).trim();
  
  
          const areaName =
            String(
              location.Area?.name || ""
            ).trim();
  
  
          // Pending แสดงแค่ Pending
          const locationName =
            rackName.toUpperCase() ===
            "PENDING"
              ? rackName
              : `${rackName}${areaName}`;
  
  
          const locationPallets =
            palletsByLocationId.get(
              mapAreaRackId
            ) || [];
  
  
          // Newest pallet first
          locationPallets.sort(
            (a, b) =>
              Number(b.id) -
              Number(a.id)
          );
  
  
          const palletResults = [];
  
  
          // =================================================
          // PALLET
          // =================================================
  
          for (
            const pallet of
            locationPallets
          ) {
  
            const palletId =
              Number(pallet.id);
  
  
            const palletHeaders =
              headersByPalletId.get(
                palletId
              ) || [];
  
  
            palletHeaders.sort(
              (a, b) =>
                Number(a.id) -
                Number(b.id)
            );
  
  
            const labelResults = [];
  
  
            // ===============================================
            // HEADER / LABEL
            // ===============================================
  
            for (
              const header of
              palletHeaders
            ) {
  
              const headerId =
                Number(header.id);
  
  
              const headerBoxes =
                boxesByHeaderId.get(
                  headerId
                ) || [];
  
  
              headerBoxes.sort(
                (a, b) =>
                  Number(a.id) -
                  Number(b.id)
              );
  
  
              const boxResults =
                headerBoxes.map(
                  (box) => {
  
                    const isPartial =
                      fractionBoxIdSet.has(
                        Number(box.id)
                      );
  
  
                    return {
  
                      // =====================================
                      // BOX
                      // =====================================
  
                      boxId:
                        Number(box.id),
  
                      /*
                        Schema ไม่มี boxNo โดยตรง
                        ใช้ WOS No. เป็นข้อความหลักใน UI
                      */
  
                      boxNo:
                        String(
                          box.wosNo ||
                          box.id
                        ),
  
                      wosNo:
                        String(
                          box.wosNo || ""
                        ),
  
                      itemNo:
                        String(
                          box.itemNo || ""
                        ),
  
                      itemName:
                        String(
                          box.itemName || ""
                        ),
  
                      dwg:
                        String(
                          box.dwg || ""
                        ),
  
                      dieNo:
                        String(
                          box.dieNo || ""
                        ),
  
                      lotNo:
                        String(
                          box.lotNo || ""
                        ),
  
                      qty:
                        Number(
                          box.qty || 0
                        ),
  
                      type:
                        isPartial
                          ? "PARTIAL"
                          : "FULL",
  
                      isFraction:
                        isPartial,
  
                      timeStmp:
                        box.timeStmp,
  
                    };
  
                  }
                );
  
  
              // =============================================
              // HEADER TOTAL
              // =============================================
  
              const headerQty =
                boxResults.reduce(
                  (
                    sum,
                    box
                  ) =>
                    sum +
                    Number(
                      box.qty || 0
                    ),
                  0
                );
  
  
              const fullBoxCount =
                boxResults.filter(
                  (box) =>
                    box.type ===
                    "FULL"
                ).length;
  
  
              const partialBoxCount =
                boxResults.filter(
                  (box) =>
                    box.type ===
                    "PARTIAL"
                ).length;
  
  
              const firstBox =
                boxResults.length > 0
                  ? boxResults[0]
                  : null;
  
  
              // =============================================
              // LABEL
              // =============================================
  
              labelResults.push({
  
                headerId:
                  headerId,
  
                labelId:
                  String(
                    header.labelNo || ""
                  ),
  
                labelNo:
                  String(
                    header.labelNo || ""
                  ),
  
                itemNo:
                  String(
                    header.itemNo || ""
                  ),
  
                itemName:
                  String(
                    header.itemName || ""
                  ),
  
                dieNo:
                  String(
                    firstBox?.dieNo || ""
                  ),
  
                oqcLotNo:
                  String(
                    header.controlLot || ""
                  ),
  
                controlLot:
                  String(
                    header.controlLot || ""
                  ),
  
                normalQty:
                  Number(
                    header.normalQty || 0
                  ),
  
                fractionQty:
                  Number(
                    header.fractionQty || 0
                  ),
  
                qty:
                  headerQty,
  
                boxCount:
                  boxResults.length,
  
                fullBoxCount:
                  fullBoxCount,
  
                partialBoxCount:
                  partialBoxCount,
  
                boxes:
                  boxResults,
  
              });
  
  
              // =============================================
              // SUMMARY
              // =============================================
  
              totalHeader++;
  
              totalBox +=
                boxResults.length;
  
              totalFullBox +=
                fullBoxCount;
  
              totalPartialBox +=
                partialBoxCount;
  
              totalQty +=
                headerQty;
  
            }
  
  
            // ===============================================
            // PALLET TOTAL
            // ===============================================
  
            const palletQty =
              labelResults.reduce(
                (
                  sum,
                  label
                ) =>
                  sum +
                  Number(
                    label.qty || 0
                  ),
                0
              );
  
  
            const palletBoxCount =
              labelResults.reduce(
                (
                  sum,
                  label
                ) =>
                  sum +
                  Number(
                    label.boxCount || 0
                  ),
                0
              );
  
  
            // ===============================================
            // PALLET RESULT
            // ===============================================
  
            palletResults.push({
  
              id:
                palletId,
  
              palletId:
                String(
                  pallet.palletNoId || ""
                ),
  
              palletNoId:
                String(
                  pallet.palletNoId || ""
                ),
  
              receivedDate:
                pallet.date,
  
              date:
                pallet.date,
  
              shift:
                pallet.shift,
  
              labelType:
                pallet.labelType,
  
              mapAreaRackId:
                Number(
                  pallet.mapAreaRackId
                ),
  
              labelCount:
                labelResults.length,
  
              boxCount:
                palletBoxCount,
  
              qty:
                palletQty,
  
              user: {
  
                id:
                  Number(
                    pallet.User?.id ||
                    pallet.userId
                  ),
  
                empNo:
                  String(
                    pallet.User?.empNo ||
                    ""
                  ),
  
                name:
                  String(
                    pallet.User?.name ||
                    ""
                  ),
  
                role:
                  String(
                    pallet.User?.role ||
                    ""
                  ),
  
              },
  
              labels:
                labelResults,
  
              timeStmp:
                pallet.timeStmp,
  
            });
  
  
            totalPallet++;
  
          }
  
  
          // =================================================
          // LOCATION STATUS
          // =================================================
  
          const palletCount =
            palletResults.length;
  
  
          const isOccupied =
            palletCount > 0;
  
  
          const isPending =
            rackName
              .trim()
              .toUpperCase() ===
            "PENDING";
  
  
          // =================================================
          // LOCATION SUMMARY
          // =================================================
  
          totalLocation++;
  
  
          if (isOccupied) {
            occupiedLocation++;
          } else {
            emptyLocation++;
          }
  
  
          // =================================================
          // RESULT
          // =================================================
  
          results.push({
  
            mapAreaRackId:
              mapAreaRackId,
  
            rackId:
              Number(
                location.rackId
              ),
  
            areaId:
              Number(
                location.areaId
              ),
  
            rackName:
              rackName,
  
            areaName:
              areaName,
  
            locationName:
              locationName,
  
            isPending:
              isPending,
  
            isOccupied:
              isOccupied,
  
            isEmpty:
              !isOccupied,
  
            palletCount:
              palletCount,
  
            /*
              Rack ปกติส่วนใหญ่ = 0 หรือ 1 Pallet
              Pending = สามารถมากกว่า 1 ได้
            */
  
            pallets:
              palletResults,
  
          });
  
        }
  
  
        // ===================================================
        // NEXT LOCATION CHUNK
        // ===================================================
  
        lastMapAreaRackId =
          Number(
            mapAreaRackChunk[
              mapAreaRackChunk.length - 1
            ].id
          );
  
      }
  
  
      // =====================================================
      // RESPONSE
      // =====================================================
  
      return res.send({
  
        message:
          "map_location_pallet_box_success",
  
        summary: {
  
          totalLocation:
            totalLocation,
  
          occupiedLocation:
            occupiedLocation,
  
          emptyLocation:
            emptyLocation,
  
          totalPallet:
            totalPallet,
  
          totalLabel:
            totalHeader,
  
          totalBox:
            totalBox,
  
          totalFullBox:
            totalFullBox,
  
          totalPartialBox:
            totalPartialBox,
  
          totalQty:
            totalQty,
  
        },
  
        results:
          results,
  
      });
  
    } catch (e) {
  
      console.error(
        "MAP LOCATION PALLET BOX ERROR:",
        e
      );
  
  
      return res.status(500).send({
  
        message:
          "map_location_pallet_box_error",
  
        error:
          e.message,
  
      });
  
    }
  },





};
