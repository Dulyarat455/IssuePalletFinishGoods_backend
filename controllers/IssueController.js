const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const QRCode = require("qrcode");
const bwipjs = require("bwip-js");

module.exports = {
  createPalletTemp: async (req, res) => {
    try {
      const { userId, date, shift, mapAreaRackId, labelType } = req.body;

      if (
        userId == null ||
        date == null ||
        mapAreaRackId == null ||
        !shift ||
        !labelType
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const newDatePallet = new Date(date);
      if (isNaN(newDatePallet.getTime())) {
        return res.status(400).send({ message: "invalid_dateIssue" });
      }

      const createPalletTemp = await prisma.palletTemp.create({
        data: {
          date: newDatePallet,
          shift: shift,
          mapAreaRackId: parseInt(mapAreaRackId),
          labelType: labelType,
          userId: parseInt(userId),
        },
      });

      return res.send({
        message: "create_Pallet_temp_success",
        data: createPalletTemp,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  editPalletTemp: async (req, res) => {
    try {
      const { palletTempId, date, shift, mapAreaRackId, labelType } = req.body;

      if (
        palletTempId == null ||
        date == null ||
        mapAreaRackId == null ||
        !shift ||
        !labelType
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const newDatePallet = new Date(date);
      if (isNaN(newDatePallet.getTime())) {
        return res.status(400).send({ message: "invalid_dateIssue" });
      }

      const updatePalletTemp = await prisma.palletTemp.update({
        where: {
          id: parseInt(palletTempId),
        },
        data: {
          date: date,
          shift: shift,
          mapAreaRackId: parseInt(mapAreaRackId),
          labelType: labelType,
        },
      });

      return res.send({
        message: "edit_pallet_temp_success",
        data: updatePalletTemp,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  deletePalletTemp: async (req, res) => {
    try {
      const { palletTempId } = req.body;

      // =====================================================
      // VALIDATE
      // =====================================================

      if (palletTempId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const palletTempIdInt = parseInt(palletTempId);

      if (Number.isNaN(palletTempIdInt)) {
        return res.status(400).send({
          message: "invalid_palletTempId",
        });
      }

      // =====================================================
      // CHECK PALLET
      // =====================================================

      const checkPallet = await prisma.palletTemp.findFirst({
        where: {
          id: palletTempIdInt,

          status: "use",
        },
      });

      if (!checkPallet) {
        return res.status(404).send({
          message: "pallet_temp_not_found",
        });
      }

      // =====================================================
      // DELETE TRANSACTION
      // =====================================================

      const result = await prisma.$transaction(async (tx) => {
        // =================================================
        // 1) FIND HEADER ทั้งหมดของ PALLET นี้
        // =================================================

        const headers = await tx.headerIssueTemp.findMany({
          where: {
            palletTempId: palletTempIdInt,
          },

          select: {
            id: true,
          },
        });

        // เอาไว้ Summary หลัง Delete

        let deletedMapCount = 0;

        let deletedFractionHeaderCount = 0;

        let deletedBoxCount = 0;

        let deletedHeaderCount = 0;

        // =================================================
        // 2) LOOP HEADER ทีละตัว
        // =================================================

        for (const header of headers) {
          const headerTempIdInt = Number(header.id);

          // ===============================================
          // 2.1 DELETE MAP FRACTION ก่อน
          // ===============================================

          const deletedMap = await tx.mapHeaderIssueTempFraction.deleteMany({
            where: {
              headerId: headerTempIdInt,
            },
          });

          deletedMapCount += deletedMap.count;

          // ===============================================
          // 2.2 DELETE HEADER FRACTION
          // ===============================================

          const deletedFractionHeader =
            await tx.headerIssueTempFraction.deleteMany({
              where: {
                headerId: headerTempIdInt,
              },
            });

          deletedFractionHeaderCount += deletedFractionHeader.count;

          // ===============================================
          // 2.3 DELETE BOX TEMP
          // ===============================================

          const deletedBox = await tx.boxIssueTemp.deleteMany({
            where: {
              headerId: headerTempIdInt,
            },
          });

          deletedBoxCount += deletedBox.count;

          // ===============================================
          // 2.4 DELETE HEADER TEMP
          // ===============================================

          const deletedHeader = await tx.headerIssueTemp.deleteMany({
            where: {
              id: headerTempIdInt,

              palletTempId: palletTempIdInt,
            },
          });

          deletedHeaderCount += deletedHeader.count;
        }

        // =================================================
        // 3) DELETE PALLET TEMP
        // หลัง Header ทั้งหมดถูกลบแล้ว
        // =================================================

        const deletedPallet = await tx.palletTemp.delete({
          where: {
            id: palletTempIdInt,
          },
        });

        // =================================================
        // RESULT
        // =================================================

        return {
          palletTempId: palletTempIdInt,

          foundHeaderCount: headers.length,

          deletedMapHeaderIssueTempFractionCount: deletedMapCount,

          deletedHeaderIssueTempFractionCount: deletedFractionHeaderCount,

          deletedBoxIssueTempCount: deletedBoxCount,

          deletedHeaderIssueTempCount: deletedHeaderCount,

          deletedPalletTemp: deletedPallet,
        };
      });

      // =====================================================
      // SUCCESS
      // =====================================================

      return res.send({
        message: "delete_pallet_temp_success",

        data: result,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  fetchPalletTemp: async (req, res) => {
    try {
      const { userId } = req.body;

      const palletTemp = await prisma.palletTemp.findFirst({
        where: {
          status: "use",
          userId: parseInt(userId),
        },
        orderBy: { id: "desc" },
      });

      return res.send({ results: palletTemp });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  createHeaderTemp: async (req, res) => {
    try {
      const {
        itemNo,
        itemName,
        groupId,
        controlLot,
        totalBox,
        moveMentThreeMonth,
        normalQty,
        palletTempId,
        userId,
      } = req.body;

      if (
        userId == null ||
        groupId == null ||
        totalBox == null ||
        normalQty == null ||
        palletTempId == null ||
        !itemNo ||
        !itemName ||
        !moveMentThreeMonth
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const headerIssueTemp = await prisma.headerIssueTemp.create({
        data: {
          palletTempId: parseInt(palletTempId),
          itemNo: itemNo,
          itemName: itemName,
          groupId: parseInt(groupId),
          controlLot: controlLot,
          normalQty: parseInt(normalQty),
          totalBox: parseInt(totalBox),
          moveMentThreeMonth: moveMentThreeMonth,
          userId: parseInt(userId),
        },
      });

      return res.send({
        message: "add_issue_header_temp_success",
        data: headerIssueTemp,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  fetchHeaderTemp: async (req, res) => {
    try {
      const { userId } = req.body;

      if (userId == null) {
        return res.status(400).send({
          message: "missing_userId",
        });
      }

      const userIdInt = parseInt(userId);

      if (Number.isNaN(userIdInt)) {
        return res.status(400).send({
          message: "invalid_userId",
        });
      }

      // ===============================
      // Header ทั้งหมดของ User
      // ===============================

      const headers = await prisma.headerIssueTemp.findMany({
        where: {
          status: "use",
          userId: userIdInt,
        },

        orderBy: {
          id: "desc",
        },
      });

      // ===============================
      // เพิ่มข้อมูล Box ของแต่ละ Header
      // ===============================

      const results = await Promise.all(
        headers.map(async (header) => {
          // ---------------------------
          // Header Fraction ล่าสุด
          // ---------------------------

          const fractionHeader = await prisma.headerIssueTempFraction.findFirst(
            {
              where: {
                headerId: header.id,
                status: "use",
              },

              orderBy: {
                id: "desc",
              },

              select: {
                id: true,
                qtyBox: true,
              },
            }
          );

          // ---------------------------
          // Box ที่ถูก Map เป็น Fraction
          // ---------------------------

          const fractionMaps = await prisma.mapHeaderIssueTempFraction.findMany(
            {
              where: {
                headerId: header.id,
                status: "use",
              },

              select: {
                boxId: true,
              },
            }
          );

          const fractionBoxIds = fractionMaps
            .map((x) => x.boxId)
            .filter((id) => id != null);

          // ---------------------------
          // Box เต็มที่ Scan แล้ว
          // เอาเฉพาะ Box ที่ไม่ได้อยู่ Fraction
          // ---------------------------

          const normalScannedQty = await prisma.boxIssueTemp.count({
            where: {
              headerId: header.id,
              status: "use",

              id:
                fractionBoxIds.length > 0
                  ? {
                      notIn: fractionBoxIds,
                    }
                  : undefined,
            },
          });

          // ---------------------------
          // Box เศษที่ Scan แล้ว
          // ---------------------------

          const fractionScannedQty = fractionMaps.length;

          return {
            ...header,

            fractionQty: Number(fractionHeader?.qtyBox || 0),

            normalScannedQty: Number(normalScannedQty),

            fractionScannedQty: Number(fractionScannedQty),
          };
        })
      );

      return res.send({
        results: results,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  editHeaderTemp: async (req, res) => {
    try {
      const {
        headerTempId,
        userId,
        itemNo,
        itemName,
        groupId,
        controlLot,
        totalBox,
        moveMentThreeMonth,
        normalQty,
        palletTempId,
      } = req.body;

      if (
        userId == null ||
        groupId == null ||
        !controlLot ||
        totalBox == null ||
        headerTempId == null ||
        normalQty == null ||
        palletTempId == null ||
        !itemNo ||
        !itemName ||
        !moveMentThreeMonth
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      // update headTemp issue

      const headerIssueTemp = await prisma.headerIssueTemp.update({
        where: {
          id: parseInt(headerTempId),
          palletTempId: parseInt(palletTempId),
          userId: parseInt(userId),
        },
        data: {
          itemNo: itemNo,
          itemName: itemName,
          groupId: parseInt(groupId),
          controlLot: controlLot,
          normalQty: parseInt(normalQty),
          totalBox: parseInt(totalBox),
          moveMentThreeMonth: moveMentThreeMonth,
        },
      });

      return res.send({
        message: "edit_issue_header_temp_success",
        data: headerIssueTemp,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  createBoxTemp: async (req, res) => {
    try {
      const { headTempId, itemNo, itemName, wosNo, dwg, dieNo, lotNo, qty } =
        req.body;

      if (
        headTempId == null ||
        !itemNo ||
        !itemName ||
        !wosNo ||
        !dwg ||
        !dieNo ||
        !lotNo ||
        qty == null
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkBoxByItemMaster = await prisma.partMaster.findFirst({
        where: {
          itemNo: itemNo,
          status: "use",
        },
      });

      if (!checkBoxByItemMaster) {
        return res
          .status(400)
          .send({ message: "ไม่มี ItemNo และ ItemName นี้ในระบบ" });
      }

      //  //check in table box before scan receive temp
      //  const  checkBoxIssue = await prisma.box.findFirst({
      //   where: {
      //       wosNo: wosNo,
      //       BoxState: "wait",
      //       status: "use"
      //   }
      // })
      // if(checkBoxIssue){
      //   return res.status(400).send({ message: 'WOS No นี้ทำการ Issue แล้ว'});
      // }

      const checkBoxRepeat = await prisma.boxIssueTemp.findFirst({
        where: {
          wosNo: wosNo,
          status: "use",
        },
      });

      if (checkBoxRepeat) {
        return res.status(400).send({ message: "WOS No นี้ถูก Scan ไปแล้ว" });
      }

      const boxIssueTemp = await prisma.boxIssueTemp.create({
        data: {
          headerId: parseInt(headTempId),
          itemNo: itemNo,
          itemName: itemName,
          wosNo: wosNo,
          dwg: dwg,
          dieNo: dieNo,
          lotNo: lotNo,
          qty: parseInt(qty),
        },
      });

      return res.send({
        message: "add_box_issue_temp_success",
        data: boxIssueTemp,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  fetchBoxTempByHeadId: async (req, res) => {
    try {
      const { headerId } = req.body;

      if (headerId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headerIdInt = parseInt(headerId);

      if (Number.isNaN(headerIdInt)) {
        return res.status(400).send({
          message: "invalid_headerId",
        });
      }

      const rows = await prisma.boxIssueTemp.findMany({
        where: {
          status: "use",
          headerId: headerIdInt,

          // ไม่เอา Box ที่ถูก map เป็น Box เศษแล้ว
          MapHeaderIssueTempFraction: {
            none: {
              headerId: headerIdInt,
              status: "use",
            },
          },
        },
        orderBy: {
          id: "asc",
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
        },
      });

      return res.send({
        results: rows,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  editBoxIssueTemp: async (req, res) => {
    try {
      const { headTempId, boxTempId, qty } = req.body;

      if (headTempId == null || boxTempId == null || qty == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headTempIdInt = parseInt(headTempId);
      const boxTempIdInt = parseInt(boxTempId);
      const qtyInt = parseInt(qty);

      if (
        Number.isNaN(headTempIdInt) ||
        Number.isNaN(boxTempIdInt) ||
        Number.isNaN(qtyInt)
      ) {
        return res.status(400).send({
          message: "invalid_number_fields",
        });
      }

      if (qtyInt <= 0) {
        return res.status(400).send({
          message: "invalid_qty",
        });
      }

      const checkBoxIssueTemp = await prisma.boxIssueTemp.findFirst({
        where: {
          id: boxTempIdInt,
          headerId: headTempIdInt,
          status: "use",
        },
      });

      if (!checkBoxIssueTemp) {
        return res.status(400).send({
          message: "box_issueTemp_notFound",
        });
      }

      const update = await prisma.boxIssueTemp.update({
        where: {
          id: boxTempIdInt,
        },
        data: {
          qty: qtyInt,
        },
      });

      return res.send({
        message: "update_BoxTemp_success",
        data: update,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  createHeaderTempFraction: async (req, res) => {
    try {
      const { headTempId, qtyBox } = req.body;

      if (headTempId == null || qtyBox == null) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
        where: {
          id: parseInt(headTempId),
          status: "use",
        },
      });

      if (!checkHeaderIssueTemp) {
        return res.status(400).send({ message: "header_issueTemp_notFound" });
      }

      const headerIssueTempFraction =
        await prisma.headerIssueTempFraction.create({
          data: {
            headerId: parseInt(headTempId),
            qtyBox: parseInt(qtyBox),
          },
        });

      return res.send({
        message: "create_headerTempFraction_success",
        data: headerIssueTempFraction,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  mapFractionTemp: async (req, res) => {
    try {
      const {
        headTempId,
        headFractionId,
        itemNo,
        itemName,
        wosNo,
        dwg,
        dieNo,
        lotNo,
        qty,
      } = req.body;

      if (
        headTempId == null ||
        headFractionId == null ||
        !itemNo ||
        !itemName ||
        !wosNo ||
        !dwg ||
        !dieNo ||
        !lotNo ||
        qty == null
      ) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
        where: {
          id: parseInt(headTempId),
          status: "use",
        },
      });

      if (!checkHeaderIssueTemp) {
        return res.status(400).send({ message: "header_issueTemp_notFound" });
      }

      const headerIssueTempFraction =
        await prisma.headerIssueTempFraction.findFirst({
          where: {
            id: parseInt(headFractionId),
            status: "use",
          },
        });

      if (!headerIssueTempFraction) {
        return res
          .status(400)
          .send({ message: "header_issueTemp_fraction_notFound" });
      }

      const checkBoxByItemMaster = await prisma.partMaster.findFirst({
        where: {
          itemNo: itemNo,
          status: "use",
        },
      });

      if (!checkBoxByItemMaster) {
        return res
          .status(400)
          .send({ message: "ไม่มี ItemNo และ ItemName นี้ในระบบ" });
      }

      const checkBoxRepeat = await prisma.boxIssueTemp.findFirst({
        where: {
          wosNo: wosNo,
          status: "use",
        },
      });

      if (checkBoxRepeat) {
        return res.status(400).send({ message: "WOS No นี้ถูก Scan ไปแล้ว" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const boxIssueTemp = await tx.boxIssueTemp.create({
          data: {
            headerId: parseInt(headTempId),
            itemNo: itemNo,
            itemName: itemName,
            wosNo: wosNo,
            dwg: dwg,
            dieNo: dieNo,
            lotNo: lotNo,
            qty: parseInt(qty),
          },
        });

        const mapHeaderIssueTempFraction =
          await tx.mapHeaderIssueTempFraction.create({
            data: {
              headerId: parseInt(headTempId),
              headerFractionId: parseInt(headFractionId),
              boxId: parseInt(boxIssueTemp.id),
            },
          });

        return {
          boxIssueTemp,
          mapHeaderIssueTempFraction,
        };
      });

      return res.send({
        message: "map_fractionTemp_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({ error: e.message });
    }
  },

  fractionTempListByHeaderTempId: async (req, res) => {
    try {
      const { headTempId } = req.body;

      if (headTempId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headTempIdInt = parseInt(headTempId);

      if (Number.isNaN(headTempIdInt)) {
        return res.status(400).send({
          message: "invalid_headTempId",
        });
      }

      // 1) check ว่า HeaderIssueTemp หลักมีจริงไหม
      const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
        where: {
          id: headTempIdInt,
          status: "use",
        },
      });

      if (!checkHeaderIssueTemp) {
        return res.status(400).send({
          message: "header_issueTemp_notFound",
        });
      }

      // 2) หา HeaderIssueTempFraction จาก headerId ของ HeaderIssueTemp
      const headerFraction = await prisma.headerIssueTempFraction.findFirst({
        where: {
          headerId: headTempIdInt,
          status: "use",
        },
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          headerId: true,
          qtyBox: true,
          timeStmp: true,
          status: true,
        },
      });

      // ถ้ายังไม่มี Header เศษ ให้ return ว่าง
      if (!headerFraction) {
        return res.send({
          message: "fraction_temp_list_success",
          headerFraction: null,
          results: [],
        });
      }

      // 3) เอา id ของ HeaderIssueTempFraction ไปหา map ว่ามี boxId อะไรบ้าง
      const maps = await prisma.mapHeaderIssueTempFraction.findMany({
        where: {
          headerId: headTempIdInt,
          headerFractionId: headerFraction.id,
          status: "use",
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          headerId: true,
          headerFractionId: true,
          boxId: true,
          timeStmp: true,
        },
      });

      const boxIds = maps.map((m) => m.boxId);

      // ถ้ามี Header เศษแล้ว แต่ยังไม่มี Box ที่ map อยู่
      if (boxIds.length === 0) {
        return res.send({
          message: "fraction_temp_list_success",
          headerFraction,
          results: [],
        });
      }

      // 4) เอา boxId ไปดึงข้อมูล BoxIssueTemp
      const boxes = await prisma.boxIssueTemp.findMany({
        where: {
          id: {
            in: boxIds,
          },
          status: "use",
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
      });

      // 5) รวมข้อมูล map + box เพื่อให้ frontend ใช้งานง่าย
      const rows = maps
        .map((m) => {
          const box = boxes.find((b) => b.id === m.boxId);

          if (!box) return null;

          return {
            mapId: m.id,
            headerFractionId: m.headerFractionId,
            boxId: m.boxId,

            id: box.id,
            headerId: box.headerId,
            itemNo: box.itemNo,
            itemName: box.itemName,
            wosNo: box.wosNo,
            dwg: box.dwg,
            dieNo: box.dieNo,
            lotNo: box.lotNo,
            qty: box.qty,
            timeStmp: box.timeStmp,
            status: box.status,
          };
        })
        .filter((row) => row !== null);

      return res.send({
        message: "fraction_temp_list_success",
        headerFraction,
        results: rows,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  editFractionTemp: async (req, res) => {
    try {
      const { headFractionTempId, headTempId, qtyBox } = req.body;

      if (headFractionTempId == null || headTempId == null || qtyBox == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headFractionTempIdInt = parseInt(headFractionTempId);
      const headTempIdInt = parseInt(headTempId);
      const qtyBoxInt = parseInt(qtyBox);

      if (
        Number.isNaN(headFractionTempIdInt) ||
        Number.isNaN(headTempIdInt) ||
        Number.isNaN(qtyBoxInt)
      ) {
        return res.status(400).send({
          message: "invalid_number_fields",
        });
      }

      if (qtyBoxInt <= 0) {
        return res.status(400).send({
          message: "invalid_qtyBox",
        });
      }

      const checkHeaderFractionTemp =
        await prisma.headerIssueTempFraction.findFirst({
          where: {
            id: headFractionTempIdInt,
            headerId: headTempIdInt,
            status: "use",
          },
        });

      if (!checkHeaderFractionTemp) {
        return res.status(400).send({
          message: "header_issueTemp_fraction_notFound",
        });
      }

      const scannedCount = await prisma.mapHeaderIssueTempFraction.count({
        where: {
          headerId: headTempIdInt,
          headerFractionId: headFractionTempIdInt,
          status: "use",
        },
      });

      if (qtyBoxInt < scannedCount) {
        return res.status(400).send({
          message: "qtyBox_less_than_scanned_box",
        });
      }

      const update = await prisma.headerIssueTempFraction.update({
        where: {
          id: headFractionTempIdInt,
        },
        data: {
          qtyBox: qtyBoxInt,
        },
      });

      return res.send({
        message: "update_headerFractionTemp_success",
        data: update,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  editFractionBoxTemp: async (req, res) => {
    try {
      const { headFractionTempId, headTempId, boxTempId, qty } = req.body;

      if (
        headFractionTempId == null ||
        headTempId == null ||
        boxTempId == null ||
        qty == null
      ) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headFractionTempIdInt = parseInt(headFractionTempId);
      const headTempIdInt = parseInt(headTempId);
      const boxTempIdInt = parseInt(boxTempId);
      const qtyInt = parseInt(qty);

      if (
        Number.isNaN(headFractionTempIdInt) ||
        Number.isNaN(headTempIdInt) ||
        Number.isNaN(boxTempIdInt) ||
        Number.isNaN(qtyInt)
      ) {
        return res.status(400).send({
          message: "invalid_number_fields",
        });
      }

      if (qtyInt <= 0) {
        return res.status(400).send({
          message: "invalid_qty",
        });
      }

      const checkMapHeaderFractionTemp =
        await prisma.mapHeaderIssueTempFraction.findFirst({
          where: {
            headerId: headTempIdInt,
            headerFractionId: headFractionTempIdInt,
            boxId: boxTempIdInt,
            status: "use",
          },
        });

      if (!checkMapHeaderFractionTemp) {
        return res.status(400).send({
          message: "map_header_issueFractionTemp_notFound",
        });
      }

      const checkBoxIssueTemp = await prisma.boxIssueTemp.findFirst({
        where: {
          id: boxTempIdInt,
          headerId: headTempIdInt,
          status: "use",
        },
      });

      if (!checkBoxIssueTemp) {
        return res.status(400).send({
          message: "box_issueTemp_notFound",
        });
      }

      const update = await prisma.boxIssueTemp.update({
        where: {
          id: boxTempIdInt,
        },
        data: {
          qty: qtyInt,
        },
      });

      return res.send({
        message: "update_fractionBoxTemp_success",
        data: update,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  deleteBoxTempIssue: async (req, res) => {
    try {
      const { boxTempId } = req.body;

      if (boxTempId == null) {
        return res.status(400).send({ message: "missing_required_fields" });
      }

      const current = await prisma.boxIssueTemp.findFirst({
        where: { id: parseInt(boxTempId), status: "use" },
        select: { id: true },
      });

      if (!current) {
        return res.status(404).send({ message: "boxTemp_not_found" });
      }

      const deleted = await prisma.boxIssueTemp.delete({
        where: {
          id: parseInt(boxTempId),
        },
      });

      return res.send({ message: "delete_box_temp_success", data: deleted });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  deleteAllBoxTempIssue: async (req, res) => {
    try {
      const { headerTempId } = req.body;

      if (headerTempId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headerTempIdInt = parseInt(headerTempId);

      if (Number.isNaN(headerTempIdInt)) {
        return res.status(400).send({
          message: "invalid_headerTempId",
        });
      }

      const currentHeader = await prisma.headerIssueTemp.findFirst({
        where: {
          id: headerTempIdInt,
          status: "use",
        },
        select: {
          id: true,
        },
      });

      if (!currentHeader) {
        return res.status(404).send({
          message: "headerIssueTemp_not_found",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) หา boxId ที่ถูกใช้เป็น Box เศษแล้ว
        const mappedFractionBoxes =
          await tx.mapHeaderIssueTempFraction.findMany({
            where: {
              headerId: headerTempIdInt,
              status: "use",
            },
            select: {
              boxId: true,
            },
          });

        const mappedBoxIds = mappedFractionBoxes
          .map((x) => x.boxId)
          .filter((id) => id != null);

        // 2) ลบเฉพาะ BoxIssueTemp ที่ไม่อยู่ใน MapHeaderIssueTempFraction
        const deletedBoxIssueTemp = await tx.boxIssueTemp.deleteMany({
          where: {
            headerId: headerTempIdInt,
            status: "use",

            id:
              mappedBoxIds.length > 0
                ? {
                    notIn: mappedBoxIds,
                  }
                : undefined,
          },
        });

        return {
          headerTempId: headerTempIdInt,
          mappedBoxIds,
          skippedFractionBoxCount: mappedBoxIds.length,
          deletedBoxIssueTempCount: deletedBoxIssueTemp.count,
        };
      });

      return res.send({
        message: "delete_all_box_temp_issue_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  deleteheaderTemp: async (req, res) => {
    try {
      const { headerTempId } = req.body;

      if (headerTempId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headerTempIdInt = parseInt(headerTempId);

      if (Number.isNaN(headerTempIdInt)) {
        return res.status(400).send({
          message: "invalid_headerTempId",
        });
      }

      const current = await prisma.headerIssueTemp.findFirst({
        where: {
          id: headerTempIdInt,
          status: "use",
        },
        select: {
          id: true,
        },
      });

      if (!current) {
        return res.status(404).send({
          message: "headerIssueTemp_not_found",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) ลบ MapHeaderIssueTempFraction ก่อน
        // เพราะ map อ้างถึง HeaderIssueTemp, HeaderIssueTempFraction, BoxIssueTemp
        const deletedMapHeaderIssueTempFraction =
          await tx.mapHeaderIssueTempFraction.deleteMany({
            where: {
              headerId: headerTempIdInt,
            },
          });

        // 2) ลบ HeaderIssueTempFraction
        const deletedHeaderIssueTempFraction =
          await tx.headerIssueTempFraction.deleteMany({
            where: {
              headerId: headerTempIdInt,
            },
          });

        // 3) ลบ BoxIssueTemp ทั้งหมดของ Header นี้
        const deletedBoxIssueTemp = await tx.boxIssueTemp.deleteMany({
          where: {
            headerId: headerTempIdInt,
          },
        });

        // 4) ลบ HeaderIssueTemp ตัวหลัก
        const deletedHeaderIssueTemp = await tx.headerIssueTemp.delete({
          where: {
            id: headerTempIdInt,
          },
        });

        return {
          deletedMapHeaderIssueTempFractionCount:
            deletedMapHeaderIssueTempFraction.count,

          deletedHeaderIssueTempFractionCount:
            deletedHeaderIssueTempFraction.count,

          deletedBoxIssueTempCount: deletedBoxIssueTemp.count,

          deletedHeaderIssueTemp,
        };
      });

      return res.send({
        message: "delete_header_temp_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  deleteheaderFractionTemp: async (req, res) => {
    try {
      const { headerFractionTempId } = req.body;

      if (headerFractionTempId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headerFractionTempIdInt = parseInt(headerFractionTempId);

      if (Number.isNaN(headerFractionTempIdInt)) {
        return res.status(400).send({
          message: "invalid_headerFractionTempId",
        });
      }

      const current = await prisma.headerIssueTempFraction.findFirst({
        where: {
          id: headerFractionTempIdInt,
          status: "use",
        },
        select: {
          id: true,
          headerId: true,
          qtyBox: true,
        },
      });

      if (!current) {
        return res.status(404).send({
          message: "headerIssueTempFraction_not_found",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) หา boxId จาก MapHeaderIssueTempFraction ก่อน
        const maps = await tx.mapHeaderIssueTempFraction.findMany({
          where: {
            headerFractionId: headerFractionTempIdInt,
          },
          select: {
            id: true,
            boxId: true,
          },
        });

        const boxIds = maps.map((m) => m.boxId).filter((id) => id != null);

        // 2) ลบ MapHeaderIssueTempFraction ก่อน
        // เพราะ map มี FK ไปหา BoxIssueTemp และ HeaderIssueTempFraction
        const deletedMapHeaderIssueTempFraction =
          await tx.mapHeaderIssueTempFraction.deleteMany({
            where: {
              headerFractionId: headerFractionTempIdInt,
            },
          });

        // 3) ลบ BoxIssueTemp ที่ถูก map กับ Header Fraction นี้
        const deletedBoxIssueTemp =
          boxIds.length > 0
            ? await tx.boxIssueTemp.deleteMany({
                where: {
                  id: {
                    in: boxIds,
                  },
                },
              })
            : { count: 0 };

        // 4) ลบ HeaderIssueTempFraction
        const deletedHeaderIssueTempFraction =
          await tx.headerIssueTempFraction.delete({
            where: {
              id: headerFractionTempIdInt,
            },
          });

        return {
          headerFractionTempId: headerFractionTempIdInt,
          headerTempId: current.headerId,

          deletedMapHeaderIssueTempFractionCount:
            deletedMapHeaderIssueTempFraction.count,

          deletedBoxIssueTempCount: deletedBoxIssueTemp.count,

          deletedHeaderIssueTempFraction,
        };
      });

      return res.send({
        message: "delete_header_fraction_temp_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  deleteAllFractionBoxTemp: async (req, res) => {
    try {
      const { headerFractionId } = req.body;

      if (headerFractionId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const headerFractionIdInt = parseInt(headerFractionId);

      if (Number.isNaN(headerFractionIdInt)) {
        return res.status(400).send({
          message: "invalid_headerFractionId",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) หา boxId ทั้งหมดที่อยู่ใน headerFractionId นี้ก่อน
        const maps = await tx.mapHeaderIssueTempFraction.findMany({
          where: {
            headerFractionId: headerFractionIdInt,
          },
          select: {
            id: true,
            boxId: true,
          },
        });

        const boxIds = maps.map((m) => m.boxId).filter((id) => id != null);

        // 2) ลบ MapHeaderIssueTempFraction ก่อน
        // เพราะ table นี้อ้างอิง BoxIssueTemp อยู่
        const deletedMapHeaderIssueTempFraction =
          await tx.mapHeaderIssueTempFraction.deleteMany({
            where: {
              headerFractionId: headerFractionIdInt,
            },
          });

        // 3) ลบ BoxIssueTemp ตาม boxId ที่เก็บไว้
        const deletedBoxIssueTemp =
          boxIds.length > 0
            ? await tx.boxIssueTemp.deleteMany({
                where: {
                  id: {
                    in: boxIds,
                  },
                },
              })
            : { count: 0 };

        return {
          headerFractionId: headerFractionIdInt,
          boxIds,

          deletedMapHeaderIssueTempFractionCount:
            deletedMapHeaderIssueTempFraction.count,

          deletedBoxIssueTempCount: deletedBoxIssueTemp.count,
        };
      });

      return res.send({
        message: "delete_all_fraction_box_temp_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  deleteFractionBoxTemp: async (req, res) => {
    try {
      const { boxId } = req.body;

      if (boxId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const boxIdInt = parseInt(boxId);

      if (Number.isNaN(boxIdInt)) {
        return res.status(400).send({
          message: "invalid_boxId",
        });
      }

      const currentBox = await prisma.boxIssueTemp.findFirst({
        where: {
          id: boxIdInt,
          status: "use",
        },
        select: {
          id: true,
          headerId: true,
          itemNo: true,
          itemName: true,
          wosNo: true,
          lotNo: true,
          qty: true,
        },
      });

      if (!currentBox) {
        return res.status(404).send({
          message: "boxIssueTemp_not_found",
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1) ลบ MapHeaderIssueTempFraction ก่อน
        const deletedMapHeaderIssueTempFraction =
          await tx.mapHeaderIssueTempFraction.deleteMany({
            where: {
              boxId: boxIdInt,
            },
          });

        // 2) ลบ BoxIssueTemp จริง
        const deletedBoxIssueTemp = await tx.boxIssueTemp.delete({
          where: {
            id: boxIdInt,
          },
        });

        return {
          boxId: boxIdInt,
          deletedMapHeaderIssueTempFractionCount:
            deletedMapHeaderIssueTempFraction.count,
          deletedBoxIssueTemp,
        };
      });

      return res.send({
        message: "delete_fraction_box_temp_success",
        data: result,
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message,
      });
    }
  },

  printFullLabel: async (req, res) => {
    let browser;

    try {
      const { default: puppeteer } = await import("puppeteer");

      const { headerId, labelType } = req.body || {};

      if (headerId == null) {
        return res.status(400).send({
          message: "missing_headerId",
        });
      }

      const headerIdInt = parseInt(headerId);

      if (Number.isNaN(headerIdInt)) {
        return res.status(400).send({
          message: "invalid_headerId",
        });
      }

      /* =====================================================
       TEMP FIXED VALUE
    ===================================================== */

      const FIX_OQC_LOT_NO = "S67258";
      const FIX_ID_PALLET = "26801001";
      const FIX_ID_LABEL = "26801004";
      const FIX_LOCATION_DISPLAY = "H101";

      const FIX_LABEL_TYPE = (labelType || "FG").toString().trim() || "FG";

      /* =====================================================
       HELPERS
    ===================================================== */

      const escapeHtml = (value) => {
        return (value ?? "")
          .toString()
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      const formatNumber = (value) => {
        const n = Number(value || 0);

        if (!Number.isFinite(n)) {
          return "0";
        }

        return n.toLocaleString("en-US");
      };

      const formatDateDMY = (value) => {
        if (!value) {
          return "";
        }

        const d = new Date(value);

        if (Number.isNaN(d.getTime())) {
          return "";
        }

        return (
          `${d.getDate()}/` + `${d.getMonth() + 1}/` + `${d.getFullYear()}`
        );
      };

      /* =====================================================
       SHORT LOT NO
    ===================================================== */

      const getShortLotNo = (lotNo) => {
        const raw = (lotNo || "").toString().trim();

        if (!raw) {
          return "";
        }

        if (raw.length >= 6) {
          return raw.slice(1, 6);
        }

        return raw;
      };

      /* =====================================================
       CHUNK ARRAY
    ===================================================== */

      const chunkArray = (arr, size) => {
        const result = [];

        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }

        return result;
      };

      /* =====================================================
       QTY DISPLAY
    ===================================================== */

      const qtyMultiplyList = (qtyList = []) => {
        const qtyMap = new Map();

        qtyList.forEach((qty) => {
          const n = Number(qty || 0);

          qtyMap.set(n, (qtyMap.get(n) || 0) + 1);
        });

        return Array.from(qtyMap.entries()).map(([qty, count]) => ({
          qty,
          count,
          text: `${formatNumber(qty)} x ${count}`,
        }));
      };

      /* =====================================================
       IMAGE
    ===================================================== */

      const toPngDataUri = (buffer) => {
        return `data:image/png;base64,` + buffer.toString("base64");
      };

      /* =====================================================
       BARCODE
    ===================================================== */

      const generateBarcodeDataUrl = async (text, opts = {}) => {
        const png = await bwipjs.toBuffer({
          bcid: "code128",

          text: String(text || ""),

          scale: opts.scale || 2,

          height: opts.height || 18,

          includetext: false,

          textxalign: "center",

          backgroundcolor: "FFFFFF",
        });

        return toPngDataUri(png);
      };

      /* =====================================================
       QR CODE
    ===================================================== */

      const generateQrDataUrl = async (text, width = 150) => {
        return await QRCode.toDataURL(String(text ?? ""), {
          errorCorrectionLevel: "M",

          margin: 1,

          width: width,
        });
      };

      /* =====================================================
       FIX LENGTH
    ===================================================== */

      const padRight = (value, len) => {
        return String(value ?? "")
          .padEnd(len, " ")
          .slice(0, len);
      };

      const padLeft = (value, len) => {
        return String(value ?? "")
          .padStart(len, " ")
          .slice(-len);
      };

      /* =====================================================
       QR STOCK IN
    ===================================================== */

      const buildStockInQrText = ({ oqcLotNo, dieNo, lotNo, totalQty }) => {
        const oqcPart = padRight(oqcLotNo || "", 6);

        const scPart = padRight("", 1);

        const diePart = padRight(dieNo || "", 10);

        const lotPart = padRight(lotNo || "", 12);

        const qtyPart = padLeft(totalQty == null ? "" : String(totalQty), 13);

        return oqcPart + scPart + diePart + lotPart + qtyPart;
      };

      /* =====================================================
       QR ISSUE D/O
    ===================================================== */

      const buildIssueDoQrText = ({ lotNo, dieNo, oqcLotNo, idPallet }) => {
        const lotPart = padRight(lotNo || "", 8);

        const diePart = padRight(dieNo || "", 5);

        const boxQtyPart = padRight("", 3);

        const oqcPalletPart = padRight(
          `${oqcLotNo || ""}/${idPallet || ""}`,
          15
        );

        const remarkPart = padRight("", 15);

        return lotPart + diePart + boxQtyPart + oqcPalletPart + remarkPart;
      };

      /* =====================================================
       LOAD HEADER
    ===================================================== */

      const header = await prisma.headerIssueTemp.findFirst({
        where: {
          id: headerIdInt,

          status: "use",
        },

        include: {
          User: true,
        },
      });

      if (!header) {
        return res.status(400).send({
          message: "header_issueTemp_notFound",
        });
      }

      /* =====================================================
       LOCATION
    ===================================================== */

      const location = await prisma.location.findFirst({
        where: {
          id: header.locationId,

          status: "use",
        },
      });

      /* =====================================================
       NORMAL BOX
    ===================================================== */

      const normalRows = await prisma.boxIssueTemp.findMany({
        where: {
          headerId: headerIdInt,

          status: "use",

          MapHeaderIssueTempFraction: {
            none: {
              headerId: headerIdInt,

              status: "use",
            },
          },
        },

        orderBy: {
          id: "asc",
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
        },
      });

      /* =====================================================
       FRACTION BOX
    ===================================================== */

      const fractionMaps = await prisma.mapHeaderIssueTempFraction.findMany({
        where: {
          headerId: headerIdInt,

          status: "use",
        },

        orderBy: {
          id: "asc",
        },

        include: {
          BoxIssueTemp: {
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

              status: true,
            },
          },
        },
      });

      const fractionRows = fractionMaps

        .filter((map) => {
          return map.BoxIssueTemp && map.BoxIssueTemp.status === "use";
        })

        .map((map) => {
          return {
            id: map.BoxIssueTemp.id,

            headerId: map.BoxIssueTemp.headerId,

            itemNo: map.BoxIssueTemp.itemNo,

            itemName: map.BoxIssueTemp.itemName,

            wosNo: map.BoxIssueTemp.wosNo,

            dwg: map.BoxIssueTemp.dwg,

            dieNo: map.BoxIssueTemp.dieNo,

            lotNo: map.BoxIssueTemp.lotNo,

            qty: map.BoxIssueTemp.qty,
          };
        });

      /* =====================================================
       FIRST ROW
    ===================================================== */

      const firstAnyRow = normalRows[0] || fractionRows[0] || null;

      /* =====================================================
       GROUP BY LOT
    ===================================================== */

      const groupMap = new Map();

      const addRowToGroup = (row, kind) => {
        const shortLotNo = getShortLotNo(row.lotNo || "");

        const key = shortLotNo || "-";

        if (!groupMap.has(key)) {
          groupMap.set(key, {
            lotNo: shortLotNo || "-",

            dwg: (row.dwg || "").toString().trim(),

            dieNo: (row.dieNo || "").toString().trim(),

            itemNo: (row.itemNo || "").toString().trim(),

            fullQtyList: [],

            partialQtyList: [],
          });
        }

        const target = groupMap.get(key);

        const qty = Number(row.qty || 0);

        if (kind === "FULL") {
          target.fullQtyList.push(qty);
        } else {
          target.partialQtyList.push(qty);
        }
      };

      normalRows.forEach((row) => {
        addRowToGroup(row, "FULL");
      });

      fractionRows.forEach((row) => {
        addRowToGroup(row, "PARTIAL");
      });

      /* =====================================================
       GROUP RESULT
    ===================================================== */

      let groupedRows = Array.from(groupMap.values()).map((group, index) => {
        const fullQtyItems = qtyMultiplyList(group.fullQtyList);

        const partialQtyItems = qtyMultiplyList(group.partialQtyList);

        const fullTotal = group.fullQtyList.reduce((sum, qty) => {
          return sum + Number(qty || 0);
        }, 0);

        const partialTotal = group.partialQtyList.reduce((sum, qty) => {
          return sum + Number(qty || 0);
        }, 0);

        return {
          no: index + 1,

          lotNo: group.lotNo,

          dwg: group.dwg,

          dieNo: group.dieNo,

          itemNo: group.itemNo,

          fullBoxText: fullQtyItems.map((item) => item.text),

          partialBoxText: partialQtyItems.map((item) => item.text),

          totalQty: fullTotal + partialTotal,
        };
      });

      /* =====================================================
       SORT
    ===================================================== */

      groupedRows = groupedRows.sort((a, b) => {
        return String(a.lotNo).localeCompare(String(b.lotNo), undefined, {
          numeric: true,

          sensitivity: "base",
        });
      });

      groupedRows = groupedRows.map((row, index) => {
        return {
          ...row,

          no: index + 1,
        };
      });

      /* =====================================================
       HEADER VALUES
    ===================================================== */

      const itemNoForBarcode = firstAnyRow?.itemNo || header.itemNo || "";

      const itemName = header.itemName || firstAnyRow?.itemName || "";

      const idPallet = FIX_ID_PALLET;

      const idLabel = FIX_ID_LABEL;

      const oqcLotNo = FIX_OQC_LOT_NO;

      const displayLocation = FIX_LOCATION_DISPLAY;

      /* =====================================================
       ITEM BARCODE
    ===================================================== */

      const topLeftBarcode = await generateBarcodeDataUrl(itemNoForBarcode, {
        scale: 3.0,

        height: 28,
      });

      /* =====================================================
       ID PALLET / LABEL QR
    ===================================================== */

      const idPalletLabelQrText = `${idPallet}\t${idLabel}`;

      const idPalletLabelQr = await generateQrDataUrl(idPalletLabelQrText, 140);

      /* =====================================================
       LOT QR
    ===================================================== */

      const groupedRowsWithQr = [];

      for (const row of groupedRows) {
        const stockInQrText = buildStockInQrText({
          oqcLotNo: oqcLotNo,

          dieNo: row.dieNo || "",

          lotNo: row.lotNo || "",

          totalQty: row.totalQty || 0,
        });

        const issueDoQrText = buildIssueDoQrText({
          lotNo: row.lotNo || "",

          dieNo: row.dieNo || "",

          oqcLotNo: oqcLotNo,

          idPallet: idPallet,
        });

        const stockInQr = await generateQrDataUrl(stockInQrText);

        const issueDoQr = await generateQrDataUrl(issueDoQrText);

        groupedRowsWithQr.push({
          ...row,

          stockInQrText,
          issueDoQrText,

          stockInQr,
          issueDoQr,
        });
      }

      /* =====================================================
       4 GROUP / PAGE
    ===================================================== */

      const rowsPerPage = 4;

      const pageGroups =
        groupedRowsWithQr.length > 0
          ? chunkArray(groupedRowsWithQr, rowsPerPage)
          : [[]];

      /* =====================================================
       GRAND TOTAL
    ===================================================== */

      const grandTotalQty = groupedRowsWithQr.reduce((sum, row) => {
        return sum + Number(row.totalQty || 0);
      }, 0);

      /* =====================================================
       QTY CELL
    ===================================================== */

      const renderQtyCell = (items) => {
        if (!items || !items.length) {
          return `
            <div class="cell-line">
              -
            </div>
          `;
        }

        return items
          .map((text) => {
            return `
                <div class="cell-line">
                  ${escapeHtml(text)}
                </div>
              `;
          })
          .join("");
      };

      /* =====================================================
       EMPTY ROW
    ===================================================== */

      const renderEmptyRow = () => {
        return `
          <tr class="empty-row">

            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>

          </tr>
        `;
      };

      /* =====================================================
       TABLE ROWS
    ===================================================== */

      const renderTableRows = (rows) => {
        const htmlRows = [];

        for (let i = 0; i < rowsPerPage; i++) {
          const row = rows[i];

          if (!row) {
            htmlRows.push(renderEmptyRow());

            continue;
          }

          htmlRows.push(`
            <tr class="data-row">

              <td class="row-no">
                ${escapeHtml(row.no)}
              </td>

              <td class="lot-cell">
                ${escapeHtml(row.lotNo)}
              </td>

              <td class="box-cell">
                ${renderQtyCell(row.fullBoxText)}
              </td>

              <td class="box-cell">
                ${renderQtyCell(row.partialBoxText)}
              </td>

              <td class="total-cell">
                ${escapeHtml(formatNumber(row.totalQty))}
              </td>

              <td class="qr-cell">
                <img
                  class="qr-img"
                  src="${row.stockInQr}"
                />
              </td>

              <td class="qr-cell">
                <img
                  class="qr-img"
                  src="${row.issueDoQr}"
                />
              </td>

            </tr>
          `);
        }

        return htmlRows.join("");
      };

      /* =====================================================
       RENDER PAGE
    ===================================================== */

      const renderPage = (rows) => {
        const dwgNo = firstAnyRow?.dwg || "";

        const dieNo = firstAnyRow?.dieNo || "";

        const employeeEmpNo = header?.User?.empNo || "";

        const employeeName = header?.User?.name || "";

        return `
          <section class="page">

            <div class="sheet">


              <!-- TOP HEADER -->

              <div class="top-header">


                <div class="barcode-wrap">

                  <img
                    class="top-barcode"
                    src="${topLeftBarcode}"
                  />

                </div>


                <div class="top-center">

                  <div class="item-no">

                    ${escapeHtml(itemNoForBarcode)}

                  </div>


                  <div class="item-name">

                    ${escapeHtml(itemName)}

                  </div>

                </div>


                <div class="top-type">

                  ${escapeHtml(FIX_LABEL_TYPE)}

                </div>


              </div>



              <!-- LOCATION / OQC -->

              <div class="highlight-row">


                <div class="highlight-location">

                  Loc. ${escapeHtml(displayLocation)}

                </div>


                <div class="highlight-oqc">

                  OQC Lot No.&nbsp;
                  ${escapeHtml(oqcLotNo)}

                </div>


                <div></div>


              </div>



              <!-- META + ID QR -->

              <div class="meta-grid">


                <div class="meta-left">


                  <div class="meta-row">

                    <span class="label">
                      Date :
                    </span>

                    <span class="value">

                      ${escapeHtml(formatDateDMY(header.dateIssue))}

                    </span>

                  </div>


                  <div class="meta-row employee-row">

                    <span class="label">
                      Employee. :
                    </span>

                    <span class="value employee-value">

                      <span>

                        ${escapeHtml(employeeEmpNo)}

                      </span>


                      <span>

                        ${escapeHtml(employeeName)}

                      </span>

                    </span>

                  </div>


                  <div class="meta-row remark-row">

                    <span class="label">
                      Remark
                    </span>

                    <span class="value">
                      &nbsp;
                    </span>

                  </div>


                </div>



                <div class="meta-center">


                  <div class="meta-row">

                    <span class="label">
                      Dwg.No.
                    </span>

                    <span class="value">

                      ${escapeHtml(dwgNo)}

                    </span>

                  </div>


                  <div class="meta-row">

                    <span class="label">
                      Die No.
                    </span>

                    <span class="value">

                      ${escapeHtml(dieNo)}

                    </span>

                  </div>


                  <div class="meta-row">

                    <span class="label">
                      Total Qty
                    </span>

                    <span class="value">

                      ${escapeHtml(formatNumber(grandTotalQty))}

                      <span class="pcs">
                        pcs
                      </span>

                    </span>

                  </div>


                </div>



                <div class="id-qr-block">


                  <img
                    class="id-qr-img"
                    src="${idPalletLabelQr}"
                  />


                  <div class="id-info">

                    <div>

                      ID Pallet :
                      ${escapeHtml(idPallet)}

                    </div>


                    <div>

                      ID Label :
                      ${escapeHtml(idLabel)}

                    </div>

                  </div>


                </div>


              </div>



              <!-- TABLE -->

              <div class="table-area">

                <table class="main-table">


                  <thead>

                    <tr>

                      <th class="col-no">
                        No.
                      </th>

                      <th class="col-lot">
                        Lot No.
                      </th>

                      <th class="col-box">
                        Full Box
                      </th>

                      <th class="col-box">
                        Partial Box
                      </th>

                      <th class="col-total">
                        Total Qty
                      </th>

                      <th class="col-qr">
                        Stock in
                      </th>

                      <th class="col-qr">
                        Issue D/O
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    ${renderTableRows(rows)}

                  </tbody>


                </table>

              </div>



              <!-- FOOTER -->

              <div class="bottom-bar">


                <div class="bottom-left">

                  Normal movement within 3 month.

                  &nbsp;&nbsp;&nbsp;

                  If over, move within :

                  <b>

                    ${escapeHtml(header.moveMentThreeMonth || "-")}

                  </b>

                </div>


                <div class="bottom-right">

                  QA-02-001-A0646 Rev. C

                </div>


              </div>


            </div>

          </section>
        `;
      };

      /* =====================================================
       ALL PAGE
    ===================================================== */

      const pagesHtml = pageGroups.map((rows) => renderPage(rows)).join("");

      /* =====================================================
       HTML
    ===================================================== */

      const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8" />


        <style>


          @page {

            size:
              A4 landscape;

            margin:
              5mm;

          }



          * {

            box-sizing:
              border-box;

          }



          html,
          body {

            margin:
              0;

            padding:
              0;

            width:
              100%;

            font-family:
              Arial,
              "TH Sarabun New",
              sans-serif;

            color:
              #111;

          }



          body {

            font-size:
              14px;

          }



          /* ==========================================
             PAGE
          =========================================== */

          .page {

            width:
              100%;

            height:
              200mm;

            break-after:
              page;

            page-break-after:
              always;

          }



          .page:last-child {

            break-after:
              auto;

            page-break-after:
              auto;

          }



          .sheet {

            width:
              100%;

            height:
              200mm;

            border:
              2px solid #222;

            padding:
              8px 10px 8px;

            display:
              flex;

            flex-direction:
              column;

            position:
              relative;

          }



          /* ==========================================
             TOP HEADER
          =========================================== */

          .top-header {

            display:
              grid;

            grid-template-columns:
              300px
              minmax(0, 1fr)
              78px;

            column-gap:
              24px;

            align-items:
              start;

            min-height:
              106px;

            margin-bottom:
              3px;

          }



          .barcode-wrap {

            padding-top:
              5px;

          }



          .top-barcode {

            display:
              block;

            width:
              285px;

            height:
              72px;

            object-fit:
              fill;

          }



          .top-center {

            padding-top:
              1px;

            min-width:
              0;

          }



          .item-no {

            color:
              #111;

            font-size:
              48px;

            line-height:
              1;

            font-weight:
              900;

            letter-spacing:
              0.2px;

            white-space:
              nowrap;

            margin-bottom:
              13px;

          }



          .item-name {

            color:
              #111;

            font-size:
              41px;

            line-height:
              1.02;

            font-weight:
              900;

            white-space:
              nowrap;

          }



          .top-type {

            color:
              #111;

            text-align:
              right;

            font-size:
              36px;

            line-height:
              1;

            font-weight:
              900;

            padding-top:
              9px;

          }



          /* ==========================================
             LOCATION + OQC
          =========================================== */

          .highlight-row {

            display:
              grid;

            grid-template-columns:
              300px
              minmax(0, 1fr)
              78px;

            column-gap:
              24px;

            align-items:
              center;

            min-height:
              51px;

            margin-top:
              0;

            /*
              เดิม 7px
              รอบนี้เพิ่มระยะด้านล่าง
            */
            margin-bottom:
              14px;

          }



          .highlight-location,
          .highlight-oqc {

            color:
              #111;

            font-family:
              Arial,
              "TH Sarabun New",
              sans-serif;

            font-size:
              41px;

            line-height:
              1.02;

            font-weight:
              900;

            white-space:
              nowrap;

          }



          .highlight-location {

            padding-left:
              0;

          }



          .highlight-oqc {

            padding-left:
              0;

            min-width:
              0;

          }



          /* ==========================================
             META
          =========================================== */

          .meta-grid {

            display:
              grid;

            grid-template-columns:
              1.05fr
              0.95fr
              0.35fr
              175px;

            column-gap:
              18px;

            align-items:
              start;

            margin-top:
              0;

            margin-bottom:
              3px;

          }



          .meta-left {

            grid-column:
              1;

          }



          .meta-center {

            grid-column:
              2;

          }



          .id-qr-block {

            grid-column:
              4;

            display:
              flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              flex-start;

            margin-top:
              0;

            padding-top:
              0;

          }



          .meta-row {

            display:
              grid;

            grid-template-columns:
              125px
              minmax(0, 1fr);

            column-gap:
              8px;

            align-items:
              baseline;

            min-height:
              22px;

            margin-bottom:
              3px;

          }



          .meta-row .label {

            color:
              #64748b;

            font-size:
              16px;

            line-height:
              1.15;

            font-weight:
              700;

            white-space:
              nowrap;

          }



          .meta-row .value {

            color:
              #111;

            font-size:
              16px;

            line-height:
              1.15;

            font-weight:
              800;

            word-break:
              break-word;

          }



          .employee-row {

            align-items:
              start;

          }



          .employee-value {

            display:
              flex;

            flex-direction:
              column;

            row-gap:
              3px;

          }



          .remark-row {

            margin-top:
              2px;

          }



          .pcs {

            margin-left:
              5px;

            font-size:
              14px;

          }



          /* ==========================================
             ID QR
          =========================================== */

          .id-qr-img {

            display:
              block;

            width:
              68px;

            height:
              68px;

            object-fit:
              contain;

            margin:
              0 auto 4px;

          }



          .id-info {

            width:
              175px;

            font-size:
              13px;

            line-height:
              1.3;

            color:
              #111;

            text-align:
              center;

            white-space:
              nowrap;

          }



          .id-info > div {

            text-align:
              center;

            margin-bottom:
              2px;

          }



          /* ==========================================
             TABLE
          =========================================== */

          .table-area {

            flex:
              0 0 auto;

            width:
              100%;

            margin-top:
              5px;

          }



          .main-table {

            width:
              100%;

            border-collapse:
              collapse;

            table-layout:
              fixed;

          }



          .main-table th,
          .main-table td {

            border:
              1px solid #333;

          }



          .main-table th {

            height:
              31px;

            padding:
              4px 6px;

            background:
              #f4f4f4;

            color:
              #111;

            font-size:
              15px;

            line-height:
              1.1;

            font-weight:
              500;

            text-align:
              center;

            vertical-align:
              middle;

          }



          .main-table tbody tr {

            height:
              82px;

          }



          .main-table td {

            height:
              82px;

            padding:
              7px;

            color:
              #111;

            font-size:
              15px;

            line-height:
              1.25;

            vertical-align:
              top;

            overflow-wrap:
              anywhere;

            word-break:
              break-word;

          }



          .col-no {

            width:
              56px;

          }



          .col-lot {

            width:
              175px;

          }



          .col-box {

            width:
              148px;

          }



          .col-total {

            width:
              148px;

          }



          .col-qr {

            width:
              145px;

          }



          .row-no {

            text-align:
              center;

          }



          .lot-cell {

            text-align:
              left;

            font-weight:
              500;

          }



          .box-cell {

            text-align:
              left;

          }



          .total-cell {

            text-align:
              right;

            font-weight:
              500;

          }



          .cell-line {

            line-height:
              1.35;

            margin-bottom:
              3px;

          }



          .qr-cell {

            text-align:
              center;

            vertical-align:
              middle !important;

            padding:
              4px !important;

          }



          .qr-img {

            display:
              inline-block;

            width:
              72px;

            height:
              72px;

            object-fit:
              contain;

          }



          .empty-row td {

            height:
              82px;

            background:
              #fff;

          }



          /* ==========================================
             FOOTER

             ขยายเข้าพื้นที่ Total Qty อีกนิด
          =========================================== */

          .bottom-bar {

            flex:
              0 0 auto;

            min-height:
              35px;

            margin-top:
              auto;

            padding:
              7px 2px 0;

            display:
              grid;

            /*
              เดิม 79 / 21
              รอบนี้ 82 / 18
            */
            grid-template-columns:
              minmax(0, 82%)
              minmax(0, 18%);

            column-gap:
              6px;

            align-items:
              end;

          }



          .bottom-left {

            color:
              #64748b;

            /*
              เดิม 23px
              เพิ่มเป็น 25px
            */
            font-size:
              25px;

            line-height:
              1.05;

            font-weight:
              400;

            white-space:
              nowrap;

          }



          .bottom-left b {

            color:
              #111;

            font-weight:
              900;

          }



          .bottom-right {

            color:
              #111;

            font-size:
              14px;

            line-height:
              1.1;

            font-weight:
              800;

            white-space:
              nowrap;

            text-align:
              right;

          }


        </style>

      </head>


      <body>

        ${pagesHtml}

      </body>


      </html>
    `;

      /* =====================================================
       PUPPETEER
    ===================================================== */

      browser = await puppeteer.launch({
        headless: true,

        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: "networkidle0",
      });

      /* =====================================================
       WAIT FONT + IMAGE
    ===================================================== */

      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const images = Array.from(document.images);

        await Promise.all(
          images.map((img) => {
            if (img.complete) {
              return Promise.resolve();
            }

            return new Promise((resolve) => {
              img.onload = resolve;

              img.onerror = resolve;
            });
          })
        );
      });

      /* =====================================================
       PDF
    ===================================================== */

      const pdfBuffer = await page.pdf({
        format: "A4",

        landscape: true,

        printBackground: true,

        preferCSSPageSize: true,

        margin: {
          top: "5mm",

          right: "5mm",

          bottom: "5mm",

          left: "5mm",
        },
      });

      /* =====================================================
       RESPONSE
    ===================================================== */

      res.setHeader("Content-Type", "application/pdf");

      res.setHeader("Content-Disposition", 'inline; filename="FullLabel.pdf"');

      return res.send(pdfBuffer);
    } catch (error) {
      console.error("printFullLabel error:", error);

      return res.status(500).send({
        error: error?.message || "Cannot generate full label PDF",
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },

  savePallet: async (req, res) => {
    try {
      const { userId, palletTempId } = req.body;

      // =====================================================
      // CONFIG
      // =====================================================

      const CHUNK_SIZE = 500;

      // =====================================================
      // VALIDATE REQUIRED
      // =====================================================

      if (userId == null || palletTempId == null) {
        return res.status(400).send({
          message: "missing_required_fields",
        });
      }

      const userIdInt = Number(userId);

      const palletTempIdInt = Number(palletTempId);

      if (!Number.isInteger(userIdInt) || userIdInt <= 0) {
        return res.status(400).send({
          message: "invalid_userId",
        });
      }

      if (!Number.isInteger(palletTempIdInt) || palletTempIdInt <= 0) {
        return res.status(400).send({
          message: "invalid_palletTempId",
        });
      }

      // =====================================================
      // CHECK PALLET TEMP
      // =====================================================

      const checkPalletTemp = await prisma.palletTemp.findFirst({
        where: {
          id: palletTempIdInt,

          status: "use",
        },
      });

      if (!checkPalletTemp) {
        return res.status(404).send({
          message: "pallet_temp_not_found",
        });
      }

      // =====================================================
      // TRANSACTION
      //
      // Copy จริงทั้งหมดสำเร็จ
      // ถึงจะ Delete Temp
      //
      // ถ้าพังตรงไหน
      // Rollback ทั้งหมด
      // =====================================================

      const result = await prisma.$transaction(
        async (tx) => {
          // #################################################
          //
          // PHASE 1
          // TEMP -> REAL
          //
          // #################################################

          // =================================================
          // 1. GET PALLET TEMP
          // =================================================

          const palletTemp = await tx.palletTemp.findUnique({
            where: {
              id: palletTempIdInt,
            },
          });

          if (!palletTemp) {
            throw new Error("pallet_temp_not_found");
          }

          // =================================================
          // 2. GENERATE PALLET NO
          // =================================================

          const thailandNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
          const year = thailandNow.getUTCFullYear();
          const month = thailandNow.getUTCMonth() + 1;
          const day = thailandNow.getUTCDate();

          // -------------------------------------------------
          // YEAR
          // 2026 -> 26
          // -------------------------------------------------
          const yearCode = String(year).slice(-2);
          // -------------------------------------------------
          // MONTH
          // -------------------------------------------------

          let monthCode = "";

          if (month === 10) {
            monthCode = "X";
          } else if (month === 11) {
            monthCode = "Y";
          } else if (month === 12) {
            monthCode = "Z";
          } else {
            monthCode = String(month);
          }

          // -------------------------------------------------
          // DAY
          // 1 -> 01
          // -------------------------------------------------
          const dayCode = String(day).padStart(2, "0");
          // -------------------------------------------------
          // PREFIX
          //
          // เช่น
          // 26 + 8 + 01
          // = 26801
          // -------------------------------------------------

          const palletNoPrefix = `${yearCode}${monthCode}${dayCode}`;

          // =================================================
          // FIND PALLET ล่าสุดของวันนี้
          // =================================================

          const lastPallet = await tx.pallet.findFirst({
            where: {
              palletNoId: {
                startsWith: palletNoPrefix,
              },
            },

            orderBy: {
              palletNoId: "desc",
            },

            select: {
              palletNoId: true,
            },
          });

          // =================================================
          // RUNNING NUMBER
          // =================================================

          let nextRunning = 1;

          if (lastPallet?.palletNoId) {
            const lastRunningText = lastPallet.palletNoId.slice(-3);

            const lastRunning = Number(lastRunningText);

            if (Number.isInteger(lastRunning) && lastRunning > 0) {
              nextRunning = lastRunning + 1;
            }
          }

          // -------------------------------------------------
          // Limit 001 - 999
          // -------------------------------------------------

          if (nextRunning > 999) {
            throw new Error("pallet_daily_running_over_999");
          }

          const runningCode = String(nextRunning).padStart(3, "0");

          const palletNoId = `${palletNoPrefix}${runningCode}`;

          // =================================================
          // 3. CREATE PALLET REAL
          // =================================================

          const newPallet = await tx.pallet.create({
            data: {
              palletNoId: palletNoId,

              date: palletTemp.date,

              shift: palletTemp.shift,

              mapAreaRackId: palletTemp.mapAreaRackId,

              labelType: palletTemp.labelType,

              // User ที่กด Save Pallet
              userId: userIdInt,
            },
          });

          // =================================================
          // SUMMARY
          // =================================================

          let createdHeaderCount = 0;

          let createdBoxCount = 0;

          let createdFractionMapCount = 0;

          const allHeaderTempIds = [];

          // =================================================
          // 4. HEADER TEMP
          //
          // อ่านทีละ 500
          // =================================================

          let lastHeaderTempId = 0;

          while (true) {
            // ===============================================
            // HEADER CHUNK
            // ===============================================

            const headerTempChunk = await tx.headerIssueTemp.findMany({
              where: {
                palletTempId: palletTempIdInt,

                id: {
                  gt: lastHeaderTempId,
                },
              },

              orderBy: {
                id: "asc",
              },

              take: CHUNK_SIZE,
            });

            // ===============================================
            // หมดแล้ว
            // ===============================================

            if (headerTempChunk.length === 0) {
              break;
            }

            // ===============================================
            // PROCESS HEADER ทีละตัว
            // ===============================================

            for (const headerTemp of headerTempChunk) {
              const headerTempId = Number(headerTemp.id);

              allHeaderTempIds.push(headerTempId);

              // =============================================
              // 4.1 GET FRACTION QTY
              //
              // จาก HeaderIssueTempFraction
              //
              // ถ้ามีหลาย record
              // SUM qtyBox
              // =============================================

              const fractionAggregate =
                await tx.headerIssueTempFraction.aggregate({
                  where: {
                    headerId: headerTempId,
                  },

                  _sum: {
                    qtyBox: true,
                  },
                });

              const fractionQty = Number(fractionAggregate?._sum?.qtyBox || 0);

              // =============================================
              // 4.2 CREATE HEADER ISSUE REAL
              // =============================================

              const newHeader = await tx.headerIssue.create({
                data: {
                  // Pallet จริง
                  palletId: newPallet.id,

                  itemNo: headerTemp.itemNo,

                  itemName: headerTemp.itemName,

                  normalQty: Number(headerTemp.normalQty || 0),

                  fractionQty: fractionQty,

                  groupId: headerTemp.groupId,

                  controlLot: String(headerTemp.controlLot || "").trim(),

                  moveMentThreeMonth: headerTemp.moveMentThreeMonth,

                  // เก็บ User ของ Header เดิม
                  userId: headerTemp.userId,

                  status: headerTemp.status || "use",
                },
              });

              createdHeaderCount++;

              // =============================================
              // 4.3 BOX ISSUE TEMP
              //
              // อ่านทีละ 500 ต่อ Header
              // =============================================

              let lastBoxTempId = 0;

              while (true) {
                // -------------------------------------------
                // BOX CHUNK
                // -------------------------------------------

                const boxTempChunk = await tx.boxIssueTemp.findMany({
                  where: {
                    headerId: headerTempId,

                    id: {
                      gt: lastBoxTempId,
                    },
                  },

                  orderBy: {
                    id: "asc",
                  },

                  take: CHUNK_SIZE,
                });

                if (boxTempChunk.length === 0) {
                  break;
                }

                // ===========================================
                // GET BOX TEMP IDs ใน CHUNK นี้
                // ===========================================

                const boxTempIds = boxTempChunk.map((box) => Number(box.id));

                // ===========================================
                // หา Fraction Map ของ Box Chunk นี้ทีเดียว
                //
                // ไม่ยิง findFirst ทีละ Box
                // ===========================================

                const tempFractionMaps =
                  await tx.mapHeaderIssueTempFraction.findMany({
                    where: {
                      headerId: headerTempId,

                      boxId: {
                        in: boxTempIds,
                      },
                    },

                    select: {
                      id: true,

                      boxId: true,

                      status: true,
                    },
                  });

                // ===========================================
                // ทำ Map เพื่อ check เร็ว
                //
                // key = BoxIssueTemp.id
                // ===========================================

                const fractionMapByBoxId = new Map();

                for (const fractionMap of tempFractionMaps) {
                  const boxId = Number(fractionMap.boxId);

                  // Box 1 ตัว
                  // ใช้ map ตัวแรก
                  if (!fractionMapByBoxId.has(boxId)) {
                    fractionMapByBoxId.set(boxId, fractionMap);
                  }
                }

                // ===========================================
                // LOOP BOX TEMP
                // ===========================================

                for (const boxTemp of boxTempChunk) {
                  const boxTempId = Number(boxTemp.id);

                  // -----------------------------------------
                  // CREATE BOX REAL
                  // -----------------------------------------

                  const newBox = await tx.box.create({
                    data: {
                      // Header จริงตัวใหม่
                      headerId: newHeader.id,

                      headerClosedId: null,

                      itemNo: boxTemp.itemNo,

                      itemName: boxTemp.itemName,

                      wosNo: boxTemp.wosNo,

                      dwg: boxTemp.dwg,

                      dieNo: boxTemp.dieNo,

                      lotNo: boxTemp.lotNo,

                      qty: boxTemp.qty,

                      status: boxTemp.status || "use",
                    },
                  });

                  createdBoxCount++;

                  // =========================================
                  // CHECK BOX เศษ
                  // =========================================

                  const tempFractionMap = fractionMapByBoxId.get(boxTempId);

                  if (tempFractionMap) {
                    // ---------------------------------------
                    // CREATE REAL FRACTION MAP
                    //
                    // headerId = HeaderIssue.id ใหม่
                    // boxId    = Box.id ใหม่
                    // ---------------------------------------

                    await tx.mapHeaderIssueFraction.create({
                      data: {
                        headerId: newHeader.id,

                        boxId: newBox.id,

                        status: tempFractionMap.status || "use",
                      },
                    });

                    createdFractionMapCount++;
                  }
                }

                // ===========================================
                // NEXT BOX CHUNK
                // ===========================================

                lastBoxTempId = Number(
                  boxTempChunk[boxTempChunk.length - 1].id
                );
              }
            }

            // ===============================================
            // NEXT HEADER CHUNK
            // ===============================================

            lastHeaderTempId = Number(
              headerTempChunk[headerTempChunk.length - 1].id
            );
          }

          // #################################################
          //
          // PHASE 2
          // DELETE TEMP
          //
          // Child -> Parent
          //
          // #################################################

          let deletedTempMapCount = 0;

          let deletedTempFractionCount = 0;

          let deletedTempBoxCount = 0;

          let deletedTempHeaderCount = 0;

          // =================================================
          // 5. DELETE CHILD TABLE
          //
          // Header IDs ทีละ 500
          // =================================================

          for (let i = 0; i < allHeaderTempIds.length; i += CHUNK_SIZE) {
            const headerIdChunk = allHeaderTempIds.slice(i, i + CHUNK_SIZE);

            // ===============================================
            // 5.1 DELETE
            // MapHeaderIssueTempFraction
            // ===============================================

            const deletedMaps = await tx.mapHeaderIssueTempFraction.deleteMany({
              where: {
                headerId: {
                  in: headerIdChunk,
                },
              },
            });

            deletedTempMapCount += deletedMaps.count;

            // ===============================================
            // 5.2 DELETE
            // HeaderIssueTempFraction
            // ===============================================

            const deletedFractions =
              await tx.headerIssueTempFraction.deleteMany({
                where: {
                  headerId: {
                    in: headerIdChunk,
                  },
                },
              });

            deletedTempFractionCount += deletedFractions.count;

            // ===============================================
            // 5.3 DELETE
            // BoxIssueTemp
            // ===============================================

            const deletedBoxes = await tx.boxIssueTemp.deleteMany({
              where: {
                headerId: {
                  in: headerIdChunk,
                },
              },
            });

            deletedTempBoxCount += deletedBoxes.count;

            // ===============================================
            // 5.4 DELETE
            // HeaderIssueTemp
            // ===============================================

            const deletedHeaders = await tx.headerIssueTemp.deleteMany({
              where: {
                id: {
                  in: headerIdChunk,
                },

                palletTempId: palletTempIdInt,
              },
            });

            deletedTempHeaderCount += deletedHeaders.count;
          }

          // =================================================
          // 5.5 DELETE PALLET TEMP
          // =================================================

          const deletedPalletTemp = await tx.palletTemp.delete({
            where: {
              id: palletTempIdInt,
            },
          });

          // =================================================
          // RESULT
          // =================================================

          return {
            // -----------------------------------------------
            // REAL
            // -----------------------------------------------

            palletTempId: palletTempIdInt,

            palletId: newPallet.id,

            palletNoId: newPallet.palletNoId,

            date: newPallet.date,

            shift: newPallet.shift,

            labelType: newPallet.labelType,

            // -----------------------------------------------
            // CREATE COUNT
            // -----------------------------------------------

            createdHeaderCount: createdHeaderCount,

            createdBoxCount: createdBoxCount,

            createdFractionMapCount: createdFractionMapCount,

            // -----------------------------------------------
            // DELETE TEMP COUNT
            // -----------------------------------------------

            deletedTempMapCount: deletedTempMapCount,

            deletedTempFractionCount: deletedTempFractionCount,

            deletedTempBoxCount: deletedTempBoxCount,

            deletedTempHeaderCount: deletedTempHeaderCount,

            deletedPalletTempId: deletedPalletTemp.id,
          };
        },

        // ===================================================
        // SQL SERVER
        //
        // Serializable ช่วยลดปัญหา Running No ชนกัน
        // ===================================================

        {
          isolationLevel: "Serializable",

          maxWait: 10000,

          timeout: 120000,
        }
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      return res.send({
        message: "save_pallet_success",

        data: result,
      });
    } catch (e) {
      console.error("SAVE PALLET ERROR:", e);

      // =====================================================
      // KNOWN ERROR
      // =====================================================

      if (e.message === "pallet_temp_not_found") {
        return res.status(404).send({
          message: "pallet_temp_not_found",
        });
      }

      if (e.message === "pallet_daily_running_over_999") {
        return res.status(400).send({
          message: "pallet_daily_running_over_999",
        });
      }

      // =====================================================
      // PRISMA UNIQUE
      // palletNoId ซ้ำ
      // =====================================================

      if (e.code === "P2002") {
        return res.status(409).send({
          message: "pallet_no_already_exists",
        });
      }

      // =====================================================
      // OTHER ERROR
      // =====================================================

      return res.status(500).send({
        error: e.message,
      });
    }
  },

  listPallet: async (req, res) => {
    try {
      // =====================================================
      // CONFIG
      // =====================================================

      const CHUNK_SIZE = 500;

      // =====================================================
      // HELPER
      // แบ่ง Array ทีละ 500
      // =====================================================

      const chunkArray = (array, size = CHUNK_SIZE) => {
        const result = [];

        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }

        return result;
      };

      // =====================================================
      // 1. FETCH PALLET ALL
      // ใช้ Cursor ID ทีละ 500
      // =====================================================

      const pallets = [];

      let lastPalletId = 0;

      while (true) {
        const rows = await prisma.pallet.findMany({
          where: {
            id: {
              gt: lastPalletId,
            },
          },

          orderBy: {
            id: "asc",
          },

          take: CHUNK_SIZE,
        });

        if (rows.length === 0) {
          break;
        }

        pallets.push(...rows);

        lastPalletId = Number(rows[rows.length - 1].id);
      }

      // =====================================================
      // ไม่มี PALLET
      // =====================================================

      if (pallets.length === 0) {
        return res.send({
          message: "fetch_pallet_success",

          summary: {
            totalPallet: 0,

            totalHeader: 0,

            totalBox: 0,

            normalBox: 0,

            fractionBox: 0,

            totalQty: 0,
          },

          results: [],
        });
      }

      // =====================================================
      // 2. FETCH HEADER ISSUE
      //
      // แบ่ง palletId ทีละ 500
      // และในแต่ละชุดดึง Header ทีละ 500
      // =====================================================

      const palletIds = pallets.map((row) => Number(row.id));

      const headers = [];

      const palletIdChunks = chunkArray(palletIds);

      for (const palletIdChunk of palletIdChunks) {
        let lastHeaderId = 0;

        while (true) {
          const rows = await prisma.headerIssue.findMany({
            where: {
              palletId: {
                in: palletIdChunk,
              },

              id: {
                gt: lastHeaderId,
              },
            },

            orderBy: {
              id: "asc",
            },

            take: CHUNK_SIZE,
          });

          if (rows.length === 0) {
            break;
          }

          headers.push(...rows);

          lastHeaderId = Number(rows[rows.length - 1].id);
        }
      }

      // =====================================================
      // 3. FETCH BOX
      // Header ID ทีละ 500
      // Box result ทีละ 500
      // =====================================================

      const boxes = [];

      const headerIds = headers.map((row) => Number(row.id));

      const headerIdChunks = chunkArray(headerIds);

      for (const headerIdChunk of headerIdChunks) {
        let lastBoxId = 0;

        while (true) {
          const rows = await prisma.box.findMany({
            where: {
              headerId: {
                in: headerIdChunk,
              },

              id: {
                gt: lastBoxId,
              },
            },

            orderBy: {
              id: "asc",
            },

            take: CHUNK_SIZE,
          });

          if (rows.length === 0) {
            break;
          }

          boxes.push(...rows);

          lastBoxId = Number(rows[rows.length - 1].id);
        }
      }

      // =====================================================
      // 4. FETCH MAP FRACTION
      //
      // ใช้ Box ID
      // เพื่อเช็คว่า Box ไหนเป็น Box เศษ
      // =====================================================

      const fractionMaps = [];

      const boxIds = boxes.map((row) => Number(row.id));

      const boxIdChunks = chunkArray(boxIds);

      for (const boxIdChunk of boxIdChunks) {
        let lastMapId = 0;

        while (true) {
          const rows = await prisma.mapHeaderIssueFraction.findMany({
            where: {
              boxId: {
                in: boxIdChunk,
              },

              id: {
                gt: lastMapId,
              },
            },

            orderBy: {
              id: "asc",
            },

            take: CHUNK_SIZE,
          });

          if (rows.length === 0) {
            break;
          }

          fractionMaps.push(...rows);

          lastMapId = Number(rows[rows.length - 1].id);
        }
      }

      // =====================================================
      // 5. FRACTION BOX SET
      //
      // Set ทำให้ check เร็วกว่า find() ทีละ Box
      // =====================================================

      const fractionBoxIdSet = new Set(
        fractionMaps.map((row) => Number(row.boxId))
      );

      // =====================================================
      // 6. GROUP BOX BY HEADER
      // =====================================================

      const boxByHeaderId = new Map();

      for (const box of boxes) {
        const headerId = Number(box.headerId);

        if (!boxByHeaderId.has(headerId)) {
          boxByHeaderId.set(headerId, []);
        }

        const isFraction = fractionBoxIdSet.has(Number(box.id));

        boxByHeaderId.get(headerId).push({
          id: Number(box.id),

          headerId: headerId,

          headerClosedId:
            box.headerClosedId == null ? null : Number(box.headerClosedId),

          itemNo: box.itemNo,

          itemName: box.itemName,

          wosNo: box.wosNo,

          dwg: box.dwg,

          dieNo: box.dieNo,

          lotNo: box.lotNo,

          qty: Number(box.qty || 0),

          timeStmp: box.timeStmp,

          status: box.status,

          // ===============================================
          // BOX FRACTION FLAG
          // ===============================================

          isFraction: isFraction,

          boxType: isFraction ? "FRACTION" : "NORMAL",
        });
      }

      // =====================================================
      // 7. SORT BOX
      //
      // NORMAL ก่อน
      // FRACTION ไว้ล่างสุด
      // =====================================================

      for (const [headerId, headerBoxes] of boxByHeaderId.entries()) {
        headerBoxes.sort((a, b) => {
          // NORMAL = 0
          // FRACTION = 1

          const typeA = a.isFraction ? 1 : 0;

          const typeB = b.isFraction ? 1 : 0;

          if (typeA !== typeB) {
            return typeA - typeB;
          }

          return Number(a.id) - Number(b.id);
        });

        boxByHeaderId.set(headerId, headerBoxes);
      }

      // =====================================================
      // 8. GROUP HEADER BY PALLET
      // =====================================================

      const headerByPalletId = new Map();

      for (const header of headers) {
        const palletId = Number(header.palletId);

        const headerBoxes = boxByHeaderId.get(Number(header.id)) || [];

        const normalBoxes = headerBoxes.filter((box) => !box.isFraction);

        const fractionBoxes = headerBoxes.filter((box) => box.isFraction);

        const totalQty = headerBoxes.reduce(
          (sum, box) => sum + Number(box.qty || 0),
          0
        );

        const headerData = {
          id: Number(header.id),

          palletId: palletId,

          itemNo: header.itemNo,

          itemName: header.itemName,

          normalQty: Number(header.normalQty || 0),

          fractionQty: Number(header.fractionQty || 0),

          groupId: Number(header.groupId),

          controlLot: header.controlLot,

          moveMentThreeMonth: header.moveMentThreeMonth,

          userId: Number(header.userId),

          timeStmp: header.timeStmp,

          status: header.status,

          // ===============================================
          // SUMMARY HEADER
          // ===============================================

          totalBox: headerBoxes.length,

          normalBox: normalBoxes.length,

          fractionBox: fractionBoxes.length,

          totalQty: totalQty,

          // ===============================================
          // BOX
          // ===============================================

          boxes: headerBoxes,
        };

        if (!headerByPalletId.has(palletId)) {
          headerByPalletId.set(palletId, []);
        }

        headerByPalletId.get(palletId).push(headerData);
      }

      // =====================================================
      // 9. BUILD FINAL PALLET RESULT
      // =====================================================

      const results = pallets.map((pallet) => {
        const palletHeaders = headerByPalletId.get(Number(pallet.id)) || [];

        // Header ID asc
        palletHeaders.sort((a, b) => Number(a.id) - Number(b.id));

        const totalBox = palletHeaders.reduce(
          (sum, header) => sum + Number(header.totalBox || 0),
          0
        );

        const normalBox = palletHeaders.reduce(
          (sum, header) => sum + Number(header.normalBox || 0),
          0
        );

        const fractionBox = palletHeaders.reduce(
          (sum, header) => sum + Number(header.fractionBox || 0),
          0
        );

        const totalQty = palletHeaders.reduce(
          (sum, header) => sum + Number(header.totalQty || 0),
          0
        );

        return {
          id: Number(pallet.id),

          palletNoId: pallet.palletNoId,

          date: pallet.date,

          shift: pallet.shift,

          mapAreaRackId: Number(pallet.mapAreaRackId),

          labelType: pallet.labelType,

          userId: Number(pallet.userId),

          timeStmp: pallet.timeStmp,

          // =============================================
          // PALLET SUMMARY
          // =============================================

          totalHeader: palletHeaders.length,

          totalBox: totalBox,

          normalBox: normalBox,

          fractionBox: fractionBox,

          totalQty: totalQty,

          // =============================================
          // HEADER
          // =============================================

          headers: palletHeaders,
        };
      });

      // =====================================================
      // NEWEST PALLET FIRST
      // =====================================================

      results.sort((a, b) => Number(b.id) - Number(a.id));

      // =====================================================
      // GLOBAL SUMMARY
      // =====================================================

      const totalHeader = results.reduce(
        (sum, pallet) => sum + pallet.totalHeader,
        0
      );

      const totalBox = results.reduce(
        (sum, pallet) => sum + pallet.totalBox,
        0
      );

      const normalBox = results.reduce(
        (sum, pallet) => sum + pallet.normalBox,
        0
      );

      const fractionBox = results.reduce(
        (sum, pallet) => sum + pallet.fractionBox,
        0
      );

      const totalQty = results.reduce(
        (sum, pallet) => sum + pallet.totalQty,
        0
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      return res.send({
        message: "fetch_pallet_success",

        summary: {
          totalPallet: results.length,

          totalHeader: totalHeader,

          totalBox: totalBox,

          normalBox: normalBox,

          fractionBox: fractionBox,

          totalQty: totalQty,
        },

        results: results,
      });
    } catch (e) {
      console.error("LIST PALLET ERROR:", e);

      return res.status(500).send({
        error: e.message,
      });
    }
  },
};
