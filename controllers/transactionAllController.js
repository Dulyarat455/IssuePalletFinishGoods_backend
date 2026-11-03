const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  list: async (req, res) => {
    try {
      // =====================================================
      // CONFIG
      // =====================================================

      const CHUNK_SIZE = 500;

      // LocAddInPallet:
      // ถ้า record ติดกัน + pallet/user เดียวกัน
      // และเวลาห่างกันไม่เกิน 10 วินาที
      // ถือว่าเป็น Add Event เดียวกัน
      const ADD_GROUP_GAP_MS = 10 * 1000;

      // =====================================================
      // HELPER : CHUNK ARRAY
      // =====================================================

      const chunkArray = (rows, size = CHUNK_SIZE) => {
        const chunks = [];

        for (let i = 0; i < rows.length; i += size) {
          chunks.push(rows.slice(i, i + size));
        }

        return chunks;
      };

      // =====================================================
      // HELPER : UNIQUE NUMBER
      // =====================================================

      const uniqueNumbers = (rows) => {
        return [
          ...new Set(
            rows
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value > 0)
          ),
        ];
      };

      // =====================================================
      // HELPER : LOAD TABLE BY ID CURSOR
      //
      // อ่านทีละ 500 จนหมด
      // =====================================================

      const loadByIdChunks = async (findManyFunction, select) => {
        const results = [];

        let lastId = 0;

        while (true) {
          const rows = await findManyFunction({
            where: {
              id: {
                gt: lastId,
              },
            },

            select,

            orderBy: {
              id: "asc",
            },

            take: CHUNK_SIZE,
          });

          if (rows.length === 0) {
            break;
          }

          results.push(...rows);

          lastId = Number(rows[rows.length - 1].id);
        }

        return results;
      };

      // =====================================================
      // 1. LOAD LOCATION TRANSACTION
      // =====================================================

      const [locCreateRows, locAddRows, locMoveRows] = await Promise.all([
        loadByIdChunks(
          (args) => prisma.locCreatePallet.findMany(args),

          {
            id: true,
            palletId: true,
            headId: true,
            userId: true,
            timeStmp: true,
          }
        ),

        loadByIdChunks(
          (args) => prisma.locAddInPallet.findMany(args),

          {
            id: true,
            palletId: true,
            headId: true,
            userId: true,
            timeStmp: true,
          }
        ),

        loadByIdChunks(
          (args) => prisma.locMovePallet.findMany(args),

          {
            id: true,
            palletId: true,
            startAreaId: true,
            endAreaId: true,
            userId: true,
            timeStmp: true,
          }
        ),
      ]);

      // =====================================================
      // 2. COLLECT PALLET IDS
      // =====================================================

      const palletIds = uniqueNumbers([
        ...locCreateRows.map((row) => row.palletId),

        ...locAddRows.map((row) => row.palletId),

        ...locMoveRows.map((row) => row.palletId),
      ]);

      // =====================================================
      // 3. LOAD PALLET
      // =====================================================

      const palletRows = [];

      for (const ids of chunkArray(palletIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.pallet.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,

            palletNoId: true,

            mapAreaRackId: true,

            labelType: true,

            timeStmp: true,

            status: true,
          },
        });

        palletRows.push(...rows);
      }

      const palletMap = new Map();

      for (const pallet of palletRows) {
        palletMap.set(Number(pallet.id), pallet);
      }

      // =====================================================
      // 4. COLLECT HEADER IDS
      //
      // Create + Add เท่านั้น
      // =====================================================

      const headerIds = uniqueNumbers([
        ...locCreateRows.map((row) => row.headId),

        ...locAddRows.map((row) => row.headId),
      ]);

      // =====================================================
      // 5. LOAD HEADER ISSUE
      // =====================================================

      const headerRows = [];

      for (const ids of chunkArray(headerIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.headerIssue.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,

            palletId: true,

            labelNo: true,

            itemNo: true,

            itemName: true,

            normalQty: true,

            fractionQty: true,

            controlLot: true,

            groupId: true,
          },
        });

        headerRows.push(...rows);
      }

      const headerMap = new Map();

      for (const header of headerRows) {
        headerMap.set(Number(header.id), header);
      }

      // =====================================================
      // 6. COLLECT GROUP IDS
      // =====================================================

      const groupIds = uniqueNumbers(
        headerRows.map((header) => header.groupId)
      );

      // =====================================================
      // 7. LOAD GROUP
      // =====================================================

      const groupRows = [];

      for (const ids of chunkArray(groupIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.group.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,
            name: true,
          },
        });

        groupRows.push(...rows);
      }

      const groupMap = new Map();

      for (const group of groupRows) {
        groupMap.set(Number(group.id), group);
      }

      // =====================================================
      // 8. COLLECT USER IDS
      // =====================================================

      const userIds = uniqueNumbers([
        ...locCreateRows.map((row) => row.userId),

        ...locAddRows.map((row) => row.userId),

        ...locMoveRows.map((row) => row.userId),
      ]);

      // =====================================================
      // 9. LOAD USER
      // =====================================================

      const userRows = [];

      for (const ids of chunkArray(userIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.user.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,

            empNo: true,

            name: true,
          },
        });

        userRows.push(...rows);
      }

      const userMap = new Map();

      for (const user of userRows) {
        userMap.set(Number(user.id), user);
      }

      // =====================================================
      // 10. COLLECT MAP AREA RACK IDS
      //
      // CREATE / ADD:
      //   pallet.mapAreaRackId
      //
      // MOVE:
      //   startAreaId + endAreaId
      // =====================================================

      const mapAreaRackIds = uniqueNumbers([
        ...palletRows.map((pallet) => pallet.mapAreaRackId),

        ...locMoveRows.map((row) => row.startAreaId),

        ...locMoveRows.map((row) => row.endAreaId),
      ]);

      // =====================================================
      // 11. LOAD MAP AREA RACK
      // =====================================================

      const mapAreaRackRows = [];

      for (const ids of chunkArray(mapAreaRackIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.mapAreaRack.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,

            rackId: true,

            areaId: true,
          },
        });

        mapAreaRackRows.push(...rows);
      }

      const mapAreaRackMap = new Map();

      for (const mapAreaRack of mapAreaRackRows) {
        mapAreaRackMap.set(Number(mapAreaRack.id), mapAreaRack);
      }

      // =====================================================
      // 12. COLLECT RACK / AREA IDS
      // =====================================================

      const rackIds = uniqueNumbers(mapAreaRackRows.map((row) => row.rackId));

      const areaIds = uniqueNumbers(mapAreaRackRows.map((row) => row.areaId));

      // =====================================================
      // 13. LOAD RACK
      // =====================================================

      const rackRows = [];

      for (const ids of chunkArray(rackIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.rack.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,
            name: true,
          },
        });

        rackRows.push(...rows);
      }

      const rackMap = new Map();

      for (const rack of rackRows) {
        rackMap.set(Number(rack.id), rack);
      }

      // =====================================================
      // 14. LOAD AREA
      // =====================================================

      const areaRows = [];

      for (const ids of chunkArray(areaIds)) {
        if (ids.length === 0) {
          continue;
        }

        const rows = await prisma.area.findMany({
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,
            name: true,
          },
        });

        areaRows.push(...rows);
      }

      const areaMap = new Map();

      for (const area of areaRows) {
        areaMap.set(Number(area.id), area);
      }

      // =====================================================
      // HELPER : GET LOCATION DETAIL
      // =====================================================

      const getLocationDetail = (mapAreaRackId) => {
        const id = Number(mapAreaRackId);

        const mapAreaRack = mapAreaRackMap.get(id);

        if (!mapAreaRack) {
          return {
            mapAreaRackId: id || null,

            rackName: "",

            areaName: "",
          };
        }

        const rack = rackMap.get(Number(mapAreaRack.rackId));

        const area = areaMap.get(Number(mapAreaRack.areaId));

        return {
          mapAreaRackId: id,

          rackName: rack?.name || "",

          areaName: area?.name || "",
        };
      };

      // =====================================================
      // HELPER : BUILD HEADER DETAIL
      // =====================================================

      const buildHeader = (headId) => {
        const header = headerMap.get(Number(headId));

        if (!header) {
          return {
            headId: Number(headId),

            labelNo: "",

            itemNo: "",

            itemName: "",

            normalQty: 0,

            fractionQty: 0,

            controlLot: "",

            groupName: "",
          };
        }

        const group = groupMap.get(Number(header.groupId));

        return {
          headId: Number(header.id),

          labelNo: header.labelNo,

          itemNo: header.itemNo,

          itemName: header.itemName,

          normalQty: Number(header.normalQty || 0),

          fractionQty: Number(header.fractionQty || 0),

          controlLot: header.controlLot,

          groupName: group?.name || "",
        };
      };

      // =====================================================
      // HELPER : GET LATEST TIME
      // =====================================================

      const getLatestTime = (rows) => {
        if (!rows.length) {
          return null;
        }

        let latest = rows[0].timeStmp;

        for (const row of rows) {
          if (new Date(row.timeStmp).getTime() > new Date(latest).getTime()) {
            latest = row.timeStmp;
          }
        }

        return latest;
      };

      // #####################################################
      //
      // CASE 1
      // LOC CREATE PALLET
      //
      // palletId เดียวกัน = 1 Create Event
      //
      // #####################################################

      const createGroupMap = new Map();

      for (const row of locCreateRows) {
        const palletId = Number(row.palletId);

        if (!createGroupMap.has(palletId)) {
          createGroupMap.set(palletId, []);
        }

        createGroupMap.get(palletId).push(row);
      }

      const createResults = [];

      for (const [palletId, rows] of createGroupMap.entries()) {
        const pallet = palletMap.get(Number(palletId));

        if (!pallet) {
          continue;
        }

        const location = getLocationDetail(pallet.mapAreaRackId);

        // Create Pallet ปกติเป็น User เดียวกันทั้งกลุ่ม
        const userId = Number(rows[0]?.userId || 0);

        const user = userMap.get(userId);

        const headers = rows.map((row) => buildHeader(row.headId));

        createResults.push({
          palletId: Number(pallet.id),

          palletNoId: pallet.palletNoId,

          mapAreaRackId: Number(pallet.mapAreaRackId),

          rackName: location.rackName,

          areaName: location.areaName,

          labelType: pallet.labelType,

          palletTimeStmp: pallet.timeStmp,

          updateTimeStmp: getLatestTime(rows),

          typeCase: "create",

          header: headers,

          userId: userId,

          empNo: user?.empNo || "",

          name: user?.name || "",
        });
      }

      // #####################################################
      //
      // CASE 2
      // LOC ADD IN PALLET
      //
      // ไม่สามารถ Group ด้วย palletId อย่างเดียว
      //
      // เงื่อนไข:
      // - palletId เดียวกัน
      // - userId เดียวกัน
      // - record ต้องติดกันตาม id
      // - เวลาห่างกัน <= ADD_GROUP_GAP_MS
      //
      // #####################################################

      const addGroups = [];

      let currentAddGroup = null;

      const sortedAddRows = [...locAddRows].sort(
        (a, b) => Number(a.id) - Number(b.id)
      );

      for (const row of sortedAddRows) {
        if (!currentAddGroup) {
          currentAddGroup = {
            rows: [row],
          };

          continue;
        }

        const previousRow =
          currentAddGroup.rows[currentAddGroup.rows.length - 1];

        const samePallet =
          Number(previousRow.palletId) === Number(row.palletId);

        const sameUser = Number(previousRow.userId) === Number(row.userId);

        // อยู่ชิดกันตาม Record ID
        const adjacentId = Number(row.id) === Number(previousRow.id) + 1;

        const previousTime = new Date(previousRow.timeStmp).getTime();

        const currentTime = new Date(row.timeStmp).getTime();

        const timeGap = Math.abs(currentTime - previousTime);

        const closeTime = timeGap <= ADD_GROUP_GAP_MS;

        if (samePallet && sameUser && adjacentId && closeTime) {
          currentAddGroup.rows.push(row);
        } else {
          addGroups.push(currentAddGroup);

          currentAddGroup = {
            rows: [row],
          };
        }
      }

      if (currentAddGroup) {
        addGroups.push(currentAddGroup);
      }

      const addResults = [];

      for (const group of addGroups) {
        const rows = group.rows;

        if (rows.length === 0) {
          continue;
        }

        const palletId = Number(rows[0].palletId);

        const pallet = palletMap.get(palletId);

        if (!pallet) {
          continue;
        }

        const location = getLocationDetail(pallet.mapAreaRackId);

        const userId = Number(rows[0].userId);

        const user = userMap.get(userId);

        const headers = rows.map((row) => buildHeader(row.headId));

        addResults.push({
          palletId: Number(pallet.id),

          palletNoId: pallet.palletNoId,

          mapAreaRackId: Number(pallet.mapAreaRackId),

          rackName: location.rackName,

          areaName: location.areaName,

          labelType: pallet.labelType,

          palletTimeStmp: pallet.timeStmp,

          updateTimeStmp: getLatestTime(rows),

          typeCase: "add",

          header: headers,

          userId: userId,

          empNo: user?.empNo || "",

          name: user?.name || "",
        });
      }

      // #####################################################
      //
      // CASE 3
      // LOC MOVE PALLET
      //
      // 1 LocMovePallet = 1 Move Event
      //
      // #####################################################

      const moveResults = [];

      for (const row of locMoveRows) {
        const palletId = Number(row.palletId);

        const pallet = palletMap.get(palletId);

        if (!pallet) {
          continue;
        }

        const startLocation = getLocationDetail(row.startAreaId);

        const endLocation = getLocationDetail(row.endAreaId);

        const userId = Number(row.userId);

        const user = userMap.get(userId);

        moveResults.push({
          palletId: Number(pallet.id),

          palletNoId: pallet.palletNoId,

          // ===============================================
          // START LOCATION
          // ===============================================

          mapAreaRackId: Number(row.startAreaId),

          rackName: startLocation.rackName,

          areaName: startLocation.areaName,

          // ===============================================
          // PALLET
          // ===============================================

          labelType: pallet.labelType,

          palletTimeStmp: pallet.timeStmp,

          // ===============================================
          // UPDATE
          // ===============================================

          updateTimeStmp: row.timeStmp,

          typeCase: "move",

          // ===============================================
          // END LOCATION
          // ===============================================

          endAreaRackId: Number(row.endAreaId),

          endRackName: endLocation.rackName,

          endAreaName: endLocation.areaName,

          // ===============================================
          // USER
          // ===============================================

          userId: userId,

          empNo: user?.empNo || "",

          name: user?.name || "",
        });
      }

      // #####################################################
      //
      // MERGE ALL TRANSACTION
      //
      // #####################################################

      const results = [...createResults, ...addResults, ...moveResults];

      // =====================================================
      // SORT NEWEST FIRST
      // =====================================================

      results.sort((a, b) => {
        const timeA = new Date(a.updateTimeStmp || 0).getTime();

        const timeB = new Date(b.updateTimeStmp || 0).getTime();

        return timeB - timeA;
      });

      // =====================================================
      // RESPONSE
      // =====================================================

      return res.send({
        message: "success",

        chunkSize: CHUNK_SIZE,

        total: results.length,

        summary: {
          create: createResults.length,

          add: addResults.length,

          move: moveResults.length,
        },

        results,
      });
    } catch (e) {
      console.error("TRANSACTION ALL LIST ERROR:", e);

      return res.status(500).send({
        error: e.message,
      });
    }
  },



  
};
