// const {PrismaClient} = require('../generated/prisma');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const jwt = require("jsonwebtoken");

module.exports = {
  create: async (req, res) => {
    try {
      const { name, empNo, password, rfId, role, sectionId, groupId } =
        req.body;

      if (
        !name ||
        !empNo ||
        !password ||
        !rfId ||
        !role ||
        sectionId == null ||
        groupId == null
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkUser = await prisma.user.findFirst({
        where: {
          empNo: empNo,
          status: "use",
        },
      });

      if (checkUser) {
        return res.status(400).send({ message: "User_name_already" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: name,
            empNo: empNo,
            password: password,
            rfId: rfId,
            role: role,
          },
          select: {
            id: true,
            name: true,
            status: true,
          },
        });

        const mapGroupSectionUser = await tx.mapGroupSectionUser.create({
          data: {
            groupId: parseInt(groupId),
            sectionId: parseInt(sectionId),
            userId: user.id,
          },
        });

        return {
          user,
          mapGroupSectionUser,
        };
      });

      return res.send({
        message: "create_user_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  list: async (req, res) => {
    try {
      const chunkSize = 500;
      const allRows = [];
      let lastId = 0;

      while (true) {
        const rows = await prisma.user.findMany({
          where: {
            status: "use",
            id: {
              gt: lastId,
            },
          },
          orderBy: {
            id: "asc",
          },
          take: chunkSize,
          select: {
            id: true,
            name: true,
            empNo: true,
            rfId: true,
            role: true,
            status: true,
            password: true,

            MapGroupSectionUser: {
              where: {
                status: "use",
              },
              orderBy: {
                id: "asc",
              },
              select: {
                id: true,
                groupId: true,
                sectionId: true,
                userId: true,
                status: true,

                Group: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },

                Section: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!rows.length) {
          break;
        }

        const mappedRows = rows.map((user) => {
          const mapRow = user.MapGroupSectionUser?.[0] || null;

          return {
            id: user.id,
            name: user.name,
            empNo: user.empNo,
            rfId: user.rfId,
            role: user.role,
            status: user.status,
            password: user.password,

            // เอา map ตัวแรกไว้ใช้แสดงใน table / form edit ง่าย ๆ
            mapGroupSectionUserId: mapRow?.id || null,

            groupId: mapRow?.groupId || null,
            groupName: mapRow?.Group?.name || "-",

            sectionId: mapRow?.sectionId || null,
            sectionName: mapRow?.Section?.name || "-",

            // เผื่ออนาคต 1 user มีหลาย group/section
            mapGroupSectionUsers: user.MapGroupSectionUser.map((item) => ({
              id: item.id,
              userId: item.userId,

              groupId: item.groupId,
              groupName: item.Group?.name || "-",

              sectionId: item.sectionId,
              sectionName: item.Section?.name || "-",

              status: item.status,
            })),
          };
        });

        allRows.push(...mappedRows);

        lastId = rows[rows.length - 1].id;

        if (rows.length < chunkSize) {
          break;
        }
      }

      return res.send({
        results: allRows,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  signIn: async (req, res) => {
    try {
      const { empNo, password } = req.body;

      if (!empNo || !password) {
        return res.status(400).send({ message: "missing_empNo_or_password" });
      }

      const u = await prisma.user.findFirst({
        where: {
          empNo: String(empNo).trim(),
          password: String(password),
          status: "use",
        },
        include: {
          MapGroupSectionUser: {
            where: {
              status: "use",
            },
            include: {
              Group: true,
              Section: true,
            },
            take: 1,
          },
        },
      });

      if (!u) {
        return res.status(401).send({ message: "unauthorized" });
      }

      const map = u.MapGroupSectionUser?.[0] || null;

      const payload = {
        id: u.id,
        empNo: u.empNo,
        name: u.name,
        role: u.role,
        rfId: u.rfId,
        status: u.status,

        groupId: map?.groupId || null,
        groupName: map?.Group?.name || null,
        sectionId: map?.sectionId || null,
        sectionName: map?.Section?.name || null,
      };

      const key = process.env.SECRET_KEY;
      if (!key) {
        return res.status(500).send({ message: "missing_SECRET_KEY" });
      }

      const token = jwt.sign(
        {
          id: payload.id,
          empNo: payload.empNo,
          role: payload.role,
          name: payload.name,
          groupId: payload.groupId,
          sectionId: payload.sectionId,
        },
        key,
        { expiresIn: "30d" }
      );

      return res.send({ token, ...payload });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  signInRfId: async (req, res) => {
    try {
      const { rfId } = req.body;

      if (rfId == null || String(rfId).trim() === "") {
        return res.status(400).send({
          message: "missing_rfId",
        });
      }

      const rfIdValue = String(rfId).trim();

      const u = await prisma.user.findFirst({
        where: {
          rfId: rfIdValue,
          status: "use",
        },

        include: {
          MapGroupSectionUser: {
            where: {
              status: "use",
            },

            include: {
              Group: true,
              Section: true,
            },

            // เอา Mapping ล่าสุด
            orderBy: {
              id: "desc",
            },

            take: 1,
          },
        },
      });

      if (!u) {
        return res.status(401).send({
          message: "unauthorized",
        });
      }

      const map = u.MapGroupSectionUser?.[0] || null;

      const payload = {
        id: u.id,

        empNo: u.empNo,

        name: u.name,

        role: u.role,

        rfId: u.rfId,

        status: u.status,

        groupId: map?.groupId ?? null,

        groupName: map?.Group?.name ?? null,

        sectionId: map?.sectionId ?? null,

        sectionName: map?.Section?.name ?? null,
      };

      const key = process.env.SECRET_KEY;

      if (!key) {
        return res.status(500).send({
          message: "missing_SECRET_KEY",
        });
      }

      const token = jwt.sign(
        {
          id: payload.id,

          empNo: payload.empNo,

          role: payload.role,

          name: payload.name,

          groupId: payload.groupId,

          sectionId: payload.sectionId,
        },

        key,

        {
          expiresIn: "30d",
        }
      );

      return res.send({
        token,
        ...payload,
      });
    } catch (e) {
      console.error("signInRfId error:", e);

      return res.status(500).send({
        error: e.message,
      });
    }
  },

  getStatusUser: async (req, res) => {
    try {
  
      // =====================================================
      // CONFIG
      // =====================================================
  
      const chunkSize = 500;
  
  
      // =====================================================
      // HELPER
      // =====================================================
  
      const chunkArray = (
        rows,
        size
      ) => {
  
        const chunks = [];
  
  
        for (
          let i = 0;
          i < rows.length;
          i += size
        ) {
  
          chunks.push(
            rows.slice(
              i,
              i + size
            )
          );
  
        }
  
  
        return chunks;
  
      };
  
  
      // =====================================================
      // GET ACTIVE USERS
      // =====================================================
  
      const users =
        await prisma.user.findMany({
  
          where: {
            status: 'use',
          },
  
  
          select: {
            id: true,
            empNo: true,
            name: true,
            role: true,
            rfId: true,
            status: true,
          },
  
  
          orderBy: {
            id: 'asc',
          },
  
        });
  
  
      // =====================================================
      // NO USER
      // =====================================================
  
      if (
        users.length === 0
      ) {
  
        return res.send({
  
          message:
            'success',
  
          chunkSize,
  
          totalUser:
            0,
  
          activeUserCount:
            0,
  
          results:
            [],
  
        });
  
      }
  
  
      // =====================================================
      // USER IDS
      // =====================================================
  
      const userIds =
        users.map(
          (user) =>
            Number(user.id)
        );
  
  
      const userIdChunks =
        chunkArray(
          userIds,
          chunkSize
        );
  
  
      // =====================================================
      // TEMP HEADER
      //
      // HeaderIssueTemp
      // =====================================================
  
      let tempHeaders = [];
  
  
      for (
        const ids of userIdChunks
      ) {
  
        if (
          ids.length === 0
        ) {
          continue;
        }
  
  
        const rows =
          await prisma.headerIssueTemp.findMany({
  
            where: {
  
              userId: {
                in: ids,
              },
  
              status: 'use',
  
            },
  
  
            select: {
  
              id: true,
  
              palletTempId: true,
  
              itemNo: true,
  
              itemName: true,
  
              normalQty: true,
  
              groupId: true,
  
              controlLot: true,
  
              totalBox: true,
  
              moveMentThreeMonth: true,
  
              userId: true,
  
              timeStmp: true,
  
              status: true,
  
            },
  
  
            orderBy: {
              timeStmp: 'desc',
            },
  
          });
  
  
        tempHeaders.push(
          ...rows
        );
  
      }
  
  
      // =====================================================
      // TEMP HEADER IDS
      // =====================================================
  
      const tempHeaderIds =
        tempHeaders.map(
          (row) =>
            Number(row.id)
        );
  
  
      // =====================================================
      // TEMP BOX
      //
      // BoxIssueTemp
      // =====================================================
  
      let tempBoxes = [];
  
  
      const tempHeaderIdChunks =
        chunkArray(
          tempHeaderIds,
          chunkSize
        );
  
  
      for (
        const ids of tempHeaderIdChunks
      ) {
  
        if (
          ids.length === 0
        ) {
          continue;
        }
  
  
        const rows =
          await prisma.boxIssueTemp.findMany({
  
            where: {
  
              headerId: {
                in: ids,
              },
  
              status: 'use',
  
            },
  
  
            select: {
  
              id: true,
  
              headerId: true,
  
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
              timeStmp: 'desc',
            },
  
          });
  
  
        tempBoxes.push(
          ...rows
        );
  
      }
  
  
      // =====================================================
      // TEMP BOX MAP
      //
      // headerId -> Box[]
      // =====================================================
  
      const tempBoxMap =
        new Map();
  
  
      for (
        const box of tempBoxes
      ) {
  
        const headerId =
          Number(
            box.headerId
          );
  
  
        if (
          !tempBoxMap.has(
            headerId
          )
        ) {
  
          tempBoxMap.set(
            headerId,
            []
          );
  
        }
  
  
        tempBoxMap
          .get(headerId)
          .push(box);
  
      }
  
  
      // =====================================================
      // BUILD TEMP RESULT
      // =====================================================
  
      const tempResults =
        tempHeaders.map(
          (header) => {
  
            const boxes =
              tempBoxMap.get(
                Number(header.id)
              ) || [];
  
  
            const requiredBox =
              Number(
                header.totalBox || 0
              );
  
  
            const scannedBox =
              boxes.length;
  
  
            const remainingBox =
              Math.max(
                requiredBox -
                  scannedBox,
                0
              );
  
  
            const isScanComplete =
              requiredBox > 0 &&
              scannedBox >=
                requiredBox;
  
  
            const latestBox =
              boxes.length > 0
                ? boxes[0]
                : null;
  
  
            return {
  
              mode:
                'TEMP',
  
              userId:
                Number(
                  header.userId
                ),
  
              headerId:
                Number(
                  header.id
                ),
  
              palletTempId:
                Number(
                  header.palletTempId
                ),
  
              itemNo:
                header.itemNo,
  
              itemName:
                header.itemName,
  
              groupId:
                Number(
                  header.groupId
                ),
  
              controlLot:
                header.controlLot,
  
              movementMonth:
                header.moveMentThreeMonth,
  
  
              // =============================================
              // PROGRESS ONLY
              // ไม่ใช้ตัดสิน Active
              // =============================================
  
              requiredBox,
  
              scannedBox,
  
              remainingBox,
  
              isScanComplete,
  
  
              // =============================================
              // IMPORTANT
              //
              // มี HeaderIssueTemp status=use
              // = ยังทำงานอยู่เสมอ
              // =============================================
  
              isPending:
                true,
  
  
              headerTime:
                header.timeStmp,
  
              latestScanTime:
                latestBox?.timeStmp ||
                null,
  
              latestBox,
  
              boxes,
  
            };
  
          }
        );
  
  
      // =====================================================
      // TAC HEADER
      //
      // HeaderIssueTempTAC
      // =====================================================
  
      let tacHeaders = [];
  
  
      for (
        const ids of userIdChunks
      ) {
  
        if (
          ids.length === 0
        ) {
          continue;
        }
  
  
        const rows =
          await prisma.headerIssueTempTAC.findMany({
  
            where: {
  
              userId: {
                in: ids,
              },
  
              status: 'use',
  
            },
  
  
            select: {
  
              id: true,
  
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
  
              status: true,
  
            },
  
  
            orderBy: {
              timeStmp: 'desc',
            },
  
          });
  
  
        tacHeaders.push(
          ...rows
        );
  
      }
  
  
      // =====================================================
      // TAC HEADER IDS
      // =====================================================
  
      const tacHeaderIds =
        tacHeaders.map(
          (row) =>
            Number(row.id)
        );
  
  
      // =====================================================
      // TAC BOX
      //
      // BoxTAC
      // =====================================================
  
      let tacBoxes = [];
  
  
      const tacHeaderIdChunks =
        chunkArray(
          tacHeaderIds,
          chunkSize
        );
  
  
      for (
        const ids of tacHeaderIdChunks
      ) {
  
        if (
          ids.length === 0
        ) {
          continue;
        }
  
  
        const rows =
          await prisma.boxTAC.findMany({
  
            where: {
  
              headerId: {
                in: ids,
              },
  
              status: 'use',
  
            },
  
  
            select: {
  
              id: true,
  
              headerId: true,
  
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
              timeStmp: 'desc',
            },
  
          });
  
  
        tacBoxes.push(
          ...rows
        );
  
      }
  
  
      // =====================================================
      // TAC BOX MAP
      // =====================================================
  
      const tacBoxMap =
        new Map();
  
  
      for (
        const box of tacBoxes
      ) {
  
        const headerId =
          Number(
            box.headerId
          );
  
  
        if (
          !tacBoxMap.has(
            headerId
          )
        ) {
  
          tacBoxMap.set(
            headerId,
            []
          );
  
        }
  
  
        tacBoxMap
          .get(headerId)
          .push(box);
  
      }
  
  
      // =====================================================
      // BUILD TAC RESULT
      // =====================================================
  
      const tacResults =
        tacHeaders.map(
          (header) => {
  
            const boxes =
              tacBoxMap.get(
                Number(header.id)
              ) || [];
  
  
            const normalQty =
              Number(
                header.normalQty || 0
              );
  
  
            const fractionQty =
              Number(
                header.fractionQty || 0
              );
  
  
            const requiredBox =
              normalQty +
              fractionQty;
  
  
            const scannedBox =
              boxes.length;
  
  
            const remainingBox =
              Math.max(
                requiredBox -
                  scannedBox,
                0
              );
  
  
            const isScanComplete =
              requiredBox > 0 &&
              scannedBox >=
                requiredBox;
  
  
            const latestBox =
              boxes.length > 0
                ? boxes[0]
                : null;
  
  
            return {
  
              mode:
                'TAC',
  
              userId:
                Number(
                  header.userId
                ),
  
              headerId:
                Number(
                  header.id
                ),
  
              palletId:
                Number(
                  header.palletId
                ),
  
              itemNo:
                header.itemNo,
  
              itemName:
                header.itemName,
  
              groupId:
                Number(
                  header.groupId
                ),
  
              controlLot:
                header.controlLot,
  
              movementMonth:
                header.moveMentThreeMonth,
  
              normalQty,
  
              fractionQty,
  
  
              // =============================================
              // PROGRESS ONLY
              // =============================================
  
              requiredBox,
  
              scannedBox,
  
              remainingBox,
  
              isScanComplete,
  
  
              // =============================================
              // IMPORTANT
              //
              // มี HeaderIssueTempTAC status=use
              // = ยังทำงานอยู่
              // =============================================
  
              isPending:
                true,
  
  
              headerTime:
                header.timeStmp,
  
              latestScanTime:
                latestBox?.timeStmp ||
                null,
  
              latestBox,
  
              boxes,
  
            };
  
          }
        );
  
  
      // =====================================================
      // GROUP TEMP BY USER
      // =====================================================
  
      const tempByUser =
        new Map();
  
  
      for (
        const row of tempResults
      ) {
  
        const userId =
          Number(
            row.userId
          );
  
  
        if (
          !tempByUser.has(
            userId
          )
        ) {
  
          tempByUser.set(
            userId,
            []
          );
  
        }
  
  
        tempByUser
          .get(userId)
          .push(row);
  
      }
  
  
      // =====================================================
      // GROUP TAC BY USER
      // =====================================================
  
      const tacByUser =
        new Map();
  
  
      for (
        const row of tacResults
      ) {
  
        const userId =
          Number(
            row.userId
          );
  
  
        if (
          !tacByUser.has(
            userId
          )
        ) {
  
          tacByUser.set(
            userId,
            []
          );
  
        }
  
  
        tacByUser
          .get(userId)
          .push(row);
  
      }
  
  
      // =====================================================
      // BUILD USER STATUS
      // =====================================================
  
      const results =
        users.map(
          (user) => {
  
            const userId =
              Number(
                user.id
              );
  
  
            const userTemp =
              tempByUser.get(
                userId
              ) || [];
  
  
            const userTac =
              tacByUser.get(
                userId
              ) || [];
  
  
            // =================================================
            // BUSINESS RULE
            //
            // มี TEMP หรือ TAC
            // = User ยังทำงานอยู่
            //
            // ไม่สน Scan ครบ / ไม่ครบ
            // =================================================
  
            const hasTemp =
              userTemp.length > 0;
  
  
            const hasTac =
              userTac.length > 0;
  
  
            const hasActiveScan =
              hasTemp ||
              hasTac;
  
  
            // =================================================
            // ACTIVE MODE
            // =================================================
  
            const activeMode =
  
              hasTemp &&
              hasTac
                ? 'TEMP_AND_TAC'
  
                : hasTemp
                ? 'TEMP'
  
                : hasTac
                ? 'TAC'
  
                : null;
  
  
            // =================================================
            // ACTION HISTORY
            // =================================================
  
            const actions = [
              ...userTemp,
              ...userTac,
            ].sort(
              (a, b) => {
  
                const timeA =
                  new Date(
                    a.latestScanTime ||
                    a.headerTime
                  ).getTime();
  
  
                const timeB =
                  new Date(
                    b.latestScanTime ||
                    b.headerTime
                  ).getTime();
  
  
                return (
                  timeB -
                  timeA
                );
  
              }
            );
  
  
            const latestAction =
              actions.length > 0
                ? actions[0]
                : null;
  
  
            // =================================================
            // BOX TOTAL
            // =================================================
  
            const tempBoxCount =
              userTemp.reduce(
                (
                  sum,
                  row
                ) =>
                  sum +
                  Number(
                    row.scannedBox || 0
                  ),
  
                0
              );
  
  
            const tacBoxCount =
              userTac.reduce(
                (
                  sum,
                  row
                ) =>
                  sum +
                  Number(
                    row.scannedBox || 0
                  ),
  
                0
              );
  
  
            // =================================================
            // RESPONSE PER USER
            // =================================================
  
            return {
  
              user: {
  
                id:
                  user.id,
  
                empNo:
                  user.empNo,
  
                name:
                  user.name,
  
                role:
                  user.role,
  
                rfId:
                  user.rfId,
  
              },
  
  
              hasActiveScan,
  
              activeMode,
  
  
              summary: {
  
                tempHeader:
                  userTemp.length,
  
                tempPending:
                  userTemp.length,
  
                tempBox:
                  tempBoxCount,
  
  
                tacHeader:
                  userTac.length,
  
                tacPending:
                  userTac.length,
  
                tacBox:
                  tacBoxCount,
  
  
                totalHeader:
                  userTemp.length +
                  userTac.length,
  
                totalPending:
                  userTemp.length +
                  userTac.length,
  
                totalBox:
                  tempBoxCount +
                  tacBoxCount,
  
              },
  
  
              // =================================================
              // ACTION ล่าสุด
              // =================================================
  
              latestAction,
  
  
              // =================================================
              // ACTIVE WORK
              //
              // Frontend current ใช้ pending.temp / pending.tac
              // เลยคงชื่อ pending ไว้
              // =================================================
  
              pending: {
  
                temp:
                  userTemp,
  
                tac:
                  userTac,
  
              },
  
  
              // =================================================
              // FULL RESULT
              // =================================================
  
              results: {
  
                temp:
                  userTemp,
  
                tac:
                  userTac,
  
                actions,
  
              },
  
            };
  
          }
        );
  
  
      // =====================================================
      // ACTIVE USER COUNT
      // =====================================================
  
      const activeUserCount =
        results.filter(
          (row) =>
            row.hasActiveScan
        ).length;
  
  
      return res.send({
  
        message:
          'success',
  
        chunkSize,
  
        totalUser:
          users.length,
  
        activeUserCount,
  
        results,
  
      });
  
  
    } catch (e) {
  
      return res.status(500).send({
  
        error:
          e.message,
  
      });
  
    }
  },
};
