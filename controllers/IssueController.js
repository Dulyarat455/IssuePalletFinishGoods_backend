const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const QRCode = require('qrcode');
const bwipjs = require('bwip-js');


module.exports = {
    createHeaderTemp: async (req, res)=> {
        try{
            const {
              dateIssue, itemNo, itemName, qtyBox, shift,
              groupId, controlLotId, locationId, totalBox,
              moveMentThreeMonth, userId  
            } = req.body;


            if( userId == null ||
                groupId == null ||
                locationId == null ||
                controlLotId == null ||
                dateIssue == null ||
                qtyBox == null ||
                totalBox == null ||
                !itemNo || !itemName || !shift || !moveMentThreeMonth
                
            ){
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const newDateIssue = new Date(dateIssue);
            if (isNaN(newDateIssue.getTime())) {
              return res.status(400).send({ message: 'invalid_dateIssue' });
            }


            const headerIssueTemp = await prisma.headerIssueTemp.create({
              data: {
                dateIssue: newDateIssue,
                itemNo: itemNo,
                itemName: itemName,
                qtyBox: parseInt(qtyBox),
                shift: shift,
                groupId: parseInt(groupId),
                controlLotId: parseInt(controlLotId),
                locationId: parseInt(locationId),
                totalBox: parseInt(totalBox),
                moveMentThreeMonth: moveMentThreeMonth,
                userId: parseInt(userId)
              }
            });

            return res.send({
              message: 'add_issue_header_temp_success',
              data: headerIssueTemp,
            });

        }catch(e){
          return res.status(500).send({ error: e.message });
        }
    },

    addNormalQty: async (req,res) => {
      try{
          const {normalQty, headTempId} = req.body;

          const headerIssueTemp = await prisma.headerIssueTemp.findFirst({
            where: {
                id:  parseInt(headTempId),
                status: 'use'
            },
            
          });

          if (!headerIssueTemp) {
            return res.status(400).send({
              message: 'header_issueTemp_notFound'
            });
          }

          const updateHeaderIssueTemp = await prisma.headerIssueTemp.update({
            where:{
                id: parseInt(headTempId)
            },
            data: {
              normalQty: parseInt(normalQty),          
            }
        });

        return res.send({
          message: 'add_normalQty_success',
          data: updateHeaderIssueTemp,
        })

      }catch(e){
        return res.status(500).send({ error: e.message });
      }
    },



    fetchHeaderTemp: async (req,res) =>{
        try{

          const { userId } = req.body;

          const headerIssueTemp = await prisma.headerIssueTemp.findFirst({
              where: {
                  status: 'use',       
                  userId: parseInt(userId)
              },
              orderBy: { id: 'desc' }
            });
          

            return res.send({ results: headerIssueTemp }); 

        }catch(e){
          return res.status(500).send({ error: e.message });
        }
    },

    editHeaderTemp: async (req,res) =>{
        try{
          const {
             headerTempId,
             userId,
             dateIssue, 
             itemNo,
             itemName,
             qtyBox,
             shift,
             groupId,
             controlLotId,
             locationId,
             totalBox,
             moveMentThreeMonth,
          } = req.body;


          if( userId == null ||
            groupId == null ||
            locationId == null ||
            controlLotId == null ||
            dateIssue == null ||
            qtyBox == null ||
            totalBox == null ||
            headerTempId == null ||
            !itemNo || !itemName || !shift || !moveMentThreeMonth
            
        ){
          return res.status(400).send({ message: 'missing_required_fields' });
        }


        const newDateIssue = new Date(dateIssue);
        if (isNaN(newDateIssue.getTime())) {
          return res.status(400).send({ message: 'invalid_dateIssue' });
        }

        // update headTemp issue

          const headerIssueTemp = await prisma.headerIssueTemp.update({
            where:{
                id: parseInt(headerTempId),
                userId: parseInt(userId)
            },
          data: {
            dateIssue: newDateIssue,
            itemNo: itemNo,
            itemName: itemName,
            qtyBox: parseInt(qtyBox),
            shift: shift,
            groupId: parseInt(groupId),
            controlLotId: parseInt(controlLotId),
            locationId: parseInt(locationId),
            totalBox: parseInt(totalBox),
            moveMentThreeMonth: moveMentThreeMonth,         
          }
        });

        return res.send({
          message: 'edit_issue_header_temp_success',
          data: headerIssueTemp,
        })

        }catch(e){
          return res.status(500).send({ error: e.message });
        }
    },

    createBoxTemp: async (req,res) =>{
        try{

          const {
            headTempId,
            itemNo, 
            itemName,
            wosNo,
            dwg,
            dieNo,
            lotNo,
            qty
         } = req.body ;


         if (
          headTempId == null ||
          !itemNo  ||
          !itemName  ||
          !wosNo  ||
          !dwg  ||
          !dieNo  ||
          !lotNo  ||
          qty == null 
        ) {
          return res.status(400).send({ message: 'missing_required_fields' });
        }


        const checkBoxByItemMaster = await prisma.partMaster.findFirst({
          where:{
            itemNo: itemNo,
            status: "use"
          }
        })

        if(!checkBoxByItemMaster){
          return res.status(400).send({ message: 'ไม่มี ItemNo และ ItemName นี้ในระบบ'});
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


        const  checkBoxRepeat = await prisma.boxIssueTemp.findFirst({
            where:{
            wosNo: wosNo,
            status: "use"
            }
        }) 

        if(checkBoxRepeat){
        return res.status(400).send({ message: 'WOS No นี้ถูก Scan ไปแล้ว'});
        }


        const boxIssueTemp = await prisma.boxIssueTemp.create({
          data: {
            headerId: parseInt(headTempId) ,
            itemNo: itemNo,
            itemName: itemName,
            wosNo: wosNo,
            dwg: dwg,
            dieNo: dieNo,
            lotNo: lotNo,
            qty: parseInt(qty)
          }
        });

        return res.send({
          message: 'add_box_issue_temp_success',
          data: boxIssueTemp,
      });



        }catch(e){
          return res.status(500).send({ error: e.message });
        }
    },


    fetchBoxTempByHeadId: async (req, res) => {
      try {
        const { headerId } = req.body;
    
        if (headerId == null) {
          return res.status(400).send({
            message: 'missing_required_fields'
          });
        }
    
        const headerIdInt = parseInt(headerId);
    
        if (Number.isNaN(headerIdInt)) {
          return res.status(400).send({
            message: 'invalid_headerId'
          });
        }
    
        const rows = await prisma.boxIssueTemp.findMany({
          where: {
            status: 'use',
            headerId: headerIdInt,
    
            // ไม่เอา Box ที่ถูก map เป็น Box เศษแล้ว
            MapHeaderIssueTempFraction: {
              none: {
                headerId: headerIdInt,
                status: 'use',
              },
            },
          },
          orderBy: {
            id: 'asc',
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



  editHeaderTemp: async (req, res) => {
    try {
      const {
        headTempId,
        dateIssue,
        itemNo,
        itemName,
        qtyBox,
        shift,
        groupId,
        controlLotId,
        locationId,
        totalBox,
        moveMentThreeMonth,
        userId
      } = req.body;
  
      if (
        headTempId == null ||
        userId == null ||
        groupId == null ||
        !shift ||
        controlLotId == null ||
        !itemNo ||
        !itemName ||
        qtyBox == null ||
        dateIssue == null ||
        locationId == null ||
        totalBox == null ||
        !moveMentThreeMonth
      ) {
        return res.status(400).send({
          message: 'missing_required_fields'
        });
      }
  
      const headTempIdInt = parseInt(headTempId);
      const userIdInt = parseInt(userId);
      const groupIdInt = parseInt(groupId);
      const controlLotIdInt = parseInt(controlLotId);
      const locationIdInt = parseInt(locationId);
      const qtyBoxInt = parseInt(qtyBox);
      const totalBoxInt = parseInt(totalBox);
  
      if (
        Number.isNaN(headTempIdInt) ||
        Number.isNaN(userIdInt) ||
        Number.isNaN(groupIdInt) ||
        Number.isNaN(controlLotIdInt) ||
        Number.isNaN(locationIdInt) ||
        Number.isNaN(qtyBoxInt) ||
        Number.isNaN(totalBoxInt)
      ) {
        return res.status(400).send({
          message: 'invalid_number_fields'
        });
      }
  
      const newDateIssue = new Date(dateIssue);
  
      if (isNaN(newDateIssue.getTime())) {
        return res.status(400).send({
          message: 'invalid_dateIssue'
        });
      }
  
      const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
        where: {
          id: headTempIdInt,
          status: 'use'
        }
      });
  
      if (!checkHeaderIssueTemp) {
        return res.status(400).send({
          message: 'header_issueTemp_notFound'
        });
      }
  
      const headerIssueTemp = await prisma.headerIssueTemp.update({
        where: {
          id: headTempIdInt
        },
        data: {
          dateIssue: newDateIssue,
          itemNo: itemNo,
          itemName: itemName,
          qtyBox: qtyBoxInt,
          shift: shift,
          groupId: groupIdInt,
          controlLotId: controlLotIdInt,
          locationId: locationIdInt,
          totalBox: totalBoxInt,
          moveMentThreeMonth: moveMentThreeMonth,
          userId: userIdInt
        }
      });
  
      return res.send({
        message: 'edit_issue_header_temp_success',
        data: headerIssueTemp
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message
      });
    }
  },


  editBoxIssueTemp: async (req, res) => {
    try {
      const { headTempId, boxTempId, qty } = req.body;
  
      if (
        headTempId == null ||
        boxTempId == null ||
        qty == null
      ) {
        return res.status(400).send({
          message: 'missing_required_fields'
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
          message: 'invalid_number_fields'
        });
      }
  
      if (qtyInt <= 0) {
        return res.status(400).send({
          message: 'invalid_qty'
        });
      }
  
      
    
      const checkBoxIssueTemp = await prisma.boxIssueTemp.findFirst({
        where: {
          id: boxTempIdInt,
          headerId: headTempIdInt,
          status: 'use'
        }
      });
  
      if (!checkBoxIssueTemp) {
        return res.status(400).send({
          message: 'box_issueTemp_notFound'
        });
      }
  
      const update = await prisma.boxIssueTemp.update({
        where: {
          id: boxTempIdInt
        },
        data: {
          qty: qtyInt
        }
      });
  
      return res.send({
        message: 'update_BoxTemp_success',
        data: update
      });
    } catch (e) {
      return res.status(500).send({
        error: e.message
      });
    }
  },


createHeaderTempFraction : async (req,res) =>{
  try{
        const { headTempId, qtyBox } = req.body;

        if (
          headTempId == null || 
          qtyBox == null 
        ) {
          return res.status(400).send({ message: 'missing_required_fields' });
        }

        const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
          where: {
            id: parseInt(headTempId) ,
            status: 'use',
          },
        });

        if (!checkHeaderIssueTemp) {
          return res.status(400).send({ message: 'header_issueTemp_notFound' });
        }  

        const headerIssueTempFraction = await prisma.headerIssueTempFraction.create({
          data: {
            headerId: parseInt(headTempId),
            qtyBox: parseInt(qtyBox)
          },
          
        });

      return res.send({
          message: 'create_headerTempFraction_success',
          data: headerIssueTempFraction,
      });


  }catch(e){
    return res.status(500).send({ error: e.message });
  }
},


mapFractionTemp : async (req,res) =>{
  try{
      const {headTempId, headFractionId, 
        itemNo,
        itemName,
        wosNo,
        dwg,
        dieNo,
        lotNo,
        qty
      } = req.body;

      if(headTempId == null || 
        headFractionId == null || 
        !itemNo ||
        !itemName ||
        !wosNo ||
        !dwg ||
        !dieNo ||
        !lotNo ||
        qty == null 
      ) {
          return res.status(400).send({ message: 'missing_required_fields' });
      }

      const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
        where: {
          id: parseInt(headTempId) ,
          status: 'use',
        },
      });

      if (!checkHeaderIssueTemp) {
        return res.status(400).send({ message: 'header_issueTemp_notFound' });
      }  

      const headerIssueTempFraction = await prisma.headerIssueTempFraction.findFirst({
        where: {
          id: parseInt(headFractionId) ,
          status: 'use',
        },
      });

      if (!headerIssueTempFraction) {
        return res.status(400).send({ message: 'header_issueTemp_fraction_notFound' });
      }


      const checkBoxByItemMaster = await prisma.partMaster.findFirst({
        where:{
          itemNo: itemNo,
          status: "use"
        }
      })

      if(!checkBoxByItemMaster){
        return res.status(400).send({ message: 'ไม่มี ItemNo และ ItemName นี้ในระบบ'});
      }


      const  checkBoxRepeat = await prisma.boxIssueTemp.findFirst({
        where:{
        wosNo: wosNo,
        status: "use"
        }
    }) 

    if(checkBoxRepeat){
    return res.status(400).send({ message: 'WOS No นี้ถูก Scan ไปแล้ว'});
    }


      const result = await prisma.$transaction(async (tx) => {

        const boxIssueTemp = await tx.boxIssueTemp.create({
          data: {
            headerId: parseInt(headTempId) ,
            itemNo: itemNo,
            itemName: itemName,
            wosNo: wosNo,
            dwg: dwg,
            dieNo: dieNo,
            lotNo: lotNo,
            qty: parseInt(qty)
          }
        });


        const mapHeaderIssueTempFraction = await tx.mapHeaderIssueTempFraction.create({
          data: {
            headerId: parseInt(headTempId),
            headerFractionId: parseInt(headFractionId),
            boxId: parseInt(boxIssueTemp.id)
          },
          
        });


        return {
          boxIssueTemp,
          mapHeaderIssueTempFraction
        }
  })


      return res.send({
        message: 'map_fractionTemp_success',
        data: result,
    });


  }catch(e){
    return res.status(500).send({ error: e.message });
  }
},




fractionTempListByHeaderTempId: async (req, res) => {
  try {
    const { headTempId } = req.body;

    if (headTempId == null) {
      return res.status(400).send({
        message: 'missing_required_fields'
      });
    }

    const headTempIdInt = parseInt(headTempId);

    if (Number.isNaN(headTempIdInt)) {
      return res.status(400).send({
        message: 'invalid_headTempId'
      });
    }

    // 1) check ว่า HeaderIssueTemp หลักมีจริงไหม
    const checkHeaderIssueTemp = await prisma.headerIssueTemp.findFirst({
      where: {
        id: headTempIdInt,
        status: 'use',
      },
    });

    if (!checkHeaderIssueTemp) {
      return res.status(400).send({
        message: 'header_issueTemp_notFound'
      });
    }

    // 2) หา HeaderIssueTempFraction จาก headerId ของ HeaderIssueTemp
    const headerFraction = await prisma.headerIssueTempFraction.findFirst({
      where: {
        headerId: headTempIdInt,
        status: 'use',
      },
      orderBy: {
        id: 'desc',
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
        message: 'fraction_temp_list_success',
        headerFraction: null,
        results: [],
      });
    }

    // 3) เอา id ของ HeaderIssueTempFraction ไปหา map ว่ามี boxId อะไรบ้าง
    const maps = await prisma.mapHeaderIssueTempFraction.findMany({
      where: {
        headerId: headTempIdInt,
        headerFractionId: headerFraction.id,
        status: 'use',
      },
      orderBy: {
        id: 'asc',
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
        message: 'fraction_temp_list_success',
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
      message: 'fraction_temp_list_success',
      headerFraction,
      results: rows,
    });
  } catch (e) {
    return res.status(500).send({
      error: e.message
    });
  }
},


editFractionTemp: async (req, res) => {
  try {
    const { headFractionTempId, headTempId, qtyBox } = req.body;

    if (
      headFractionTempId == null ||
      headTempId == null ||
      qtyBox == null
    ) {
      return res.status(400).send({
        message: 'missing_required_fields'
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
        message: 'invalid_number_fields'
      });
    }

    if (qtyBoxInt <= 0) {
      return res.status(400).send({
        message: 'invalid_qtyBox'
      });
    }

    const checkHeaderFractionTemp =
      await prisma.headerIssueTempFraction.findFirst({
        where: {
          id: headFractionTempIdInt,
          headerId: headTempIdInt,
          status: 'use'
        }
      });

    if (!checkHeaderFractionTemp) {
      return res.status(400).send({
        message: 'header_issueTemp_fraction_notFound'
      });
    }

    const scannedCount =
      await prisma.mapHeaderIssueTempFraction.count({
        where: {
          headerId: headTempIdInt,
          headerFractionId: headFractionTempIdInt,
          status: 'use'
        }
      });

    if (qtyBoxInt < scannedCount) {
      return res.status(400).send({
        message: 'qtyBox_less_than_scanned_box'
      });
    }

    const update = await prisma.headerIssueTempFraction.update({
      where: {
        id: headFractionTempIdInt
      },
      data: {
        qtyBox: qtyBoxInt
      }
    });

    return res.send({
      message: 'update_headerFractionTemp_success',
      data: update
    });
  } catch (e) {
    return res.status(500).send({
      error: e.message
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
        message: 'missing_required_fields'
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
        message: 'invalid_number_fields'
      });
    }

    if (qtyInt <= 0) {
      return res.status(400).send({
        message: 'invalid_qty'
      });
    }

    const checkMapHeaderFractionTemp =
      await prisma.mapHeaderIssueTempFraction.findFirst({
        where: {
          headerId: headTempIdInt,
          headerFractionId: headFractionTempIdInt,
          boxId: boxTempIdInt,
          status: 'use',
        },
      });

    if (!checkMapHeaderFractionTemp) {
      return res.status(400).send({
        message: 'map_header_issueFractionTemp_notFound'
      });
    }

    const checkBoxIssueTemp = await prisma.boxIssueTemp.findFirst({
      where: {
        id: boxTempIdInt,
        headerId: headTempIdInt,
        status: 'use'
      }
    });

    if (!checkBoxIssueTemp) {
      return res.status(400).send({
        message: 'box_issueTemp_notFound'
      });
    }

    const update = await prisma.boxIssueTemp.update({
      where: {
        id: boxTempIdInt
      },
      data: {
        qty: qtyInt
      }
    });

    return res.send({
      message: 'update_fractionBoxTemp_success',
      data: update
    });
  } catch (e) {
    return res.status(500).send({
      error: e.message
    });
  }
},


deleteBoxTempIssue: async (req,res) => {
  try{
      const {boxTempId} = req.body;

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
          id: parseInt(boxTempId) 
        },
      });


      return res.send({ message: "delete_box_temp_success", data: deleted });


  }catch(e){
    return res.status(500).send({
      error: e.message
    });
  }
},


deleteAllBoxTempIssue: async (req, res) => {
  try {
    const { headerTempId } = req.body;

    if (headerTempId == null) {
      return res.status(400).send({
        message: "missing_required_fields"
      });
    }

    const headerTempIdInt = parseInt(headerTempId);

    if (Number.isNaN(headerTempIdInt)) {
      return res.status(400).send({
        message: "invalid_headerTempId"
      });
    }

    const currentHeader = await prisma.headerIssueTemp.findFirst({
      where: {
        id: headerTempIdInt,
        status: "use"
      },
      select: {
        id: true
      }
    });

    if (!currentHeader) {
      return res.status(404).send({
        message: "headerIssueTemp_not_found"
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) หา boxId ที่ถูกใช้เป็น Box เศษแล้ว
      const mappedFractionBoxes = await tx.mapHeaderIssueTempFraction.findMany({
        where: {
          headerId: headerTempIdInt,
          status: "use"
        },
        select: {
          boxId: true
        }
      });

      const mappedBoxIds = mappedFractionBoxes
        .map((x) => x.boxId)
        .filter((id) => id != null);

      // 2) ลบเฉพาะ BoxIssueTemp ที่ไม่อยู่ใน MapHeaderIssueTempFraction
      const deletedBoxIssueTemp = await tx.boxIssueTemp.deleteMany({
        where: {
          headerId: headerTempIdInt,
          status: "use",

          id: mappedBoxIds.length > 0
            ? {
                notIn: mappedBoxIds
              }
            : undefined
        }
      });

      return {
        headerTempId: headerTempIdInt,
        mappedBoxIds,
        skippedFractionBoxCount: mappedBoxIds.length,
        deletedBoxIssueTempCount: deletedBoxIssueTemp.count
      };
    });

    return res.send({
      message: "delete_all_box_temp_issue_success",
      data: result
    });

  } catch (e) {
    return res.status(500).send({
      error: e.message
    });
  }
},



deleteheaderTemp: async (req, res) => {
  try {
    const { headerTempId } = req.body;

    if (headerTempId == null) {
      return res.status(400).send({
        message: "missing_required_fields"
      });
    }

    const headerTempIdInt = parseInt(headerTempId);

    if (Number.isNaN(headerTempIdInt)) {
      return res.status(400).send({
        message: "invalid_headerTempId"
      });
    }

    const current = await prisma.headerIssueTemp.findFirst({
      where: {
        id: headerTempIdInt,
        status: "use"
      },
      select: {
        id: true
      },
    });

    if (!current) {
      return res.status(404).send({
        message: "headerIssueTemp_not_found"
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
      const deletedBoxIssueTemp =
        await tx.boxIssueTemp.deleteMany({
          where: {
            headerId: headerTempIdInt,
          },
        });

      // 4) ลบ HeaderIssueTemp ตัวหลัก
      const deletedHeaderIssueTemp =
        await tx.headerIssueTemp.delete({
          where: {
            id: headerTempIdInt,
          },
        });

      return {
        deletedMapHeaderIssueTempFractionCount:
          deletedMapHeaderIssueTempFraction.count,

        deletedHeaderIssueTempFractionCount:
          deletedHeaderIssueTempFraction.count,

        deletedBoxIssueTempCount:
          deletedBoxIssueTemp.count,

        deletedHeaderIssueTemp,
      };
    });

    return res.send({
      message: "delete_header_temp_success",
      data: result,
    });

  } catch (e) {
    return res.status(500).send({
      error: e.message
    });
  }
},


deleteheaderFractionTemp: async (req, res) => {
  try {
    const { headerFractionTempId } = req.body;

    if (headerFractionTempId == null) {
      return res.status(400).send({
        message: "missing_required_fields"
      });
    }

    const headerFractionTempIdInt = parseInt(headerFractionTempId);

    if (Number.isNaN(headerFractionTempIdInt)) {
      return res.status(400).send({
        message: "invalid_headerFractionTempId"
      });
    }

    const current = await prisma.headerIssueTempFraction.findFirst({
      where: {
        id: headerFractionTempIdInt,
        status: "use"
      },
      select: {
        id: true,
        headerId: true,
        qtyBox: true,
      },
    });

    if (!current) {
      return res.status(404).send({
        message: "headerIssueTempFraction_not_found"
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

      const boxIds = maps
        .map((m) => m.boxId)
        .filter((id) => id != null);

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

        deletedBoxIssueTempCount:
          deletedBoxIssueTemp.count,

        deletedHeaderIssueTempFraction,
      };
    });

    return res.send({
      message: "delete_header_fraction_temp_success",
      data: result,
    });
  } catch (e) {
    return res.status(500).send({
      error: e.message
    });
  }
},






deleteAllFractionBoxTemp: async (req, res) => {
  try {
    const { headerFractionId } = req.body;

    if (headerFractionId == null) {
      return res.status(400).send({
        message: "missing_required_fields"
      });
    }

    const headerFractionIdInt = parseInt(headerFractionId);

    if (Number.isNaN(headerFractionIdInt)) {
      return res.status(400).send({
        message: "invalid_headerFractionId"
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

      const boxIds = maps
        .map((m) => m.boxId)
        .filter((id) => id != null);

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

        deletedBoxIssueTempCount:
          deletedBoxIssueTemp.count,
      };
    });

    return res.send({
      message: "delete_all_fraction_box_temp_success",
      data: result,
    });

  } catch (e) {
    return res.status(500).send({
      error: e.message
    });
  }
},


deleteFractionBoxTemp: async (req, res) => {
  try {
    const { boxId } = req.body;

    if (boxId == null) {
      return res.status(400).send({
        message: "missing_required_fields"
      });
    }

    const boxIdInt = parseInt(boxId);

    if (Number.isNaN(boxIdInt)) {
      return res.status(400).send({
        message: "invalid_boxId"
      });
    }

    const currentBox = await prisma.boxIssueTemp.findFirst({
      where: {
        id: boxIdInt,
        status: "use"
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
        message: "boxIssueTemp_not_found"
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
      error: e.message
    });
  }
},




printFullLabel: async (req, res) => {
  let browser;

  try {
    const { default: puppeteer } = await import('puppeteer');

    const { headerId, labelType } = req.body || {};

    if (headerId == null) {
      return res.status(400).send({
        message: 'missing_headerId'
      });
    }

    const headerIdInt = parseInt(headerId);

    if (Number.isNaN(headerIdInt)) {
      return res.status(400).send({
        message: 'invalid_headerId'
      });
    }


    /* =====================================================
       TEMP FIXED VALUE

       ภายหลังค่อยเปลี่ยนเป็นค่าจริงจากระบบ
    ===================================================== */

    const FIX_OQC_LOT_NO = 'S67258';
    const FIX_ID_PALLET = '26801001';

    const FIX_LABEL_TYPE =
      (labelType || 'FG').toString().trim() || 'FG';


    /* =====================================================
       HELPER
    ===================================================== */

    const escapeHtml = (value) => {
      return (value ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };


    const formatNumber = (value) => {
      const n = Number(value || 0);

      if (!Number.isFinite(n)) {
        return '0';
      }

      return n.toLocaleString('en-US');
    };


    const formatDateDMY = (value) => {
      if (!value) {
        return '';
      }

      const d = new Date(value);

      if (Number.isNaN(d.getTime())) {
        return '';
      }

      return (
        `${d.getDate()}/` +
        `${d.getMonth() + 1}/` +
        `${d.getFullYear()}`
      );
    };


    /* =====================================================
       SHORT LOT NO

       Example:

       L24X25ABSS

       digit 2-6
       => 24X25
    ===================================================== */

    const getShortLotNo = (lotNo) => {
      const raw =
        (lotNo || '')
          .toString()
          .trim();

      if (!raw) {
        return '';
      }

      if (raw.length >= 6) {
        return raw.slice(1, 6);
      }

      return raw;
    };


    /* =====================================================
       CHUNK ARRAY

       1-5
       6-10
       11-15
       ...
    ===================================================== */

    const chunkArray = (arr, size) => {
      const result = [];

      for (
        let i = 0;
        i < arr.length;
        i += size
      ) {
        result.push(
          arr.slice(
            i,
            i + size
          )
        );
      }

      return result;
    };


    /* =====================================================
       QTY DISPLAY

       1000
       1000
       1000

       => 1,000 x 3
    ===================================================== */

    const qtyMultiplyList = (qtyList = []) => {
      const qtyMap = new Map();

      qtyList.forEach((qty) => {
        const n = Number(qty || 0);

        qtyMap.set(
          n,
          (qtyMap.get(n) || 0) + 1
        );
      });

      return Array
        .from(qtyMap.entries())
        .map(([qty, count]) => ({
          qty,
          count,
          text: `${formatNumber(qty)} x ${count}`
        }));
    };


    /* =====================================================
       IMAGE
    ===================================================== */

    const toPngDataUri = (buffer) => {
      return (
        `data:image/png;base64,` +
        buffer.toString('base64')
      );
    };


    /* =====================================================
       BARCODE
       CODE128
    ===================================================== */

    const generateBarcodeDataUrl =
      async (
        text,
        opts = {}
      ) => {

        const png =
          await bwipjs.toBuffer({
            bcid: 'code128',

            text:
              String(text || ''),

            scale:
              opts.scale || 2,

            height:
              opts.height || 18,

            includetext:
              false,

            textxalign:
              'center',

            backgroundcolor:
              'FFFFFF'
          });


        return toPngDataUri(
          png
        );
      };


    /* =====================================================
       QR CODE
    ===================================================== */

    const generateQrDataUrl =
      async (text) => {

        return await QRCode.toDataURL(
          String(text || ''),
          {
            errorCorrectionLevel: 'M',

            margin: 1,

            width: 150
          }
        );
      };


    /* =====================================================
       FIXED LENGTH
    ===================================================== */

    const padRight = (
      value,
      len
    ) => {

      return String(value ?? '')
        .padEnd(
          len,
          ' '
        )
        .slice(
          0,
          len
        );
    };


    const padLeft = (
      value,
      len
    ) => {

      return String(value ?? '')
        .padStart(
          len,
          ' '
        )
        .slice(
          -len
        );
    };


    /* =====================================================
       QR STOCK IN

       OQC LOT NO = 6
       S/C        = 1
       DIE NO     = 10
       LOT NO     = 12
       TOTAL QTY  = 13

       Total = 42 Characters

       TOTAL QTY = Right Align
    ===================================================== */

    const buildStockInQrText = ({
      oqcLotNo,
      dieNo,
      lotNo,
      totalQty
    }) => {

      const oqcPart =
        padRight(
          oqcLotNo || '',
          6
        );


      /* S/C blank */
      const scPart =
        padRight(
          '',
          1
        );


      const diePart =
        padRight(
          dieNo || '',
          10
        );


      const lotPart =
        padRight(
          lotNo || '',
          12
        );


      const qtyPart =
        padLeft(
          totalQty == null
            ? ''
            : String(totalQty),
          13
        );


      return (
        oqcPart +
        scPart +
        diePart +
        lotPart +
        qtyPart
      );
    };


    /* =====================================================
       QR ISSUE D/O

       LOT NO     = 8
       DIE NO     = 5
       BOX QTY    = 3
       OQC LOT NO = 15
       REMARK #2  = 15

       BOX QTY = Blank

       OQC LOT NO =
       OQC LOT NO / ID PALLET

       REMARK #2 = Blank
    ===================================================== */

    const buildIssueDoQrText = ({
      lotNo,
      dieNo,
      oqcLotNo,
      idPallet
    }) => {

      const lotPart =
        padRight(
          lotNo || '',
          8
        );


      const diePart =
        padRight(
          dieNo || '',
          5
        );


      /* BOX QTY blank */
      const boxQtyPart =
        padRight(
          '',
          3
        );


      const oqcPalletPart =
        padRight(
          `${oqcLotNo || ''}/${idPallet || ''}`,
          15
        );


      /* REMARK #2 blank */
      const remarkPart =
        padRight(
          '',
          15
        );


      return (
        lotPart +
        diePart +
        boxQtyPart +
        oqcPalletPart +
        remarkPart
      );
    };


    /* =====================================================
       LOAD HEADER
    ===================================================== */

    const header =
      await prisma
        .headerIssueTemp
        .findFirst({

          where: {
            id:
              headerIdInt,

            status:
              'use'
          },

          include: {
            User:
              true
          }
        });


    if (!header) {
      return res.status(400).send({
        message:
          'header_issueTemp_notFound'
      });
    }


    /* =====================================================
       LOAD LOCATION
    ===================================================== */

    const location =
      await prisma
        .location
        .findFirst({

          where: {
            id:
              header.locationId,

            status:
              'use'
          }
        });


    /* =====================================================
       LOAD NORMAL BOX

       Box ที่ยังไม่ได้ถูก Map เป็น Fraction
    ===================================================== */

    const normalRows =
      await prisma
        .boxIssueTemp
        .findMany({

          where: {

            headerId:
              headerIdInt,

            status:
              'use',

            MapHeaderIssueTempFraction: {

              none: {

                headerId:
                  headerIdInt,

                status:
                  'use'
              }
            }
          },


          orderBy: {
            id:
              'asc'
          },


          select: {

            id:
              true,

            headerId:
              true,

            itemNo:
              true,

            itemName:
              true,

            wosNo:
              true,

            dwg:
              true,

            dieNo:
              true,

            lotNo:
              true,

            qty:
              true
          }
        });


    /* =====================================================
       LOAD FRACTION BOX
    ===================================================== */

    const fractionMaps =
      await prisma
        .mapHeaderIssueTempFraction
        .findMany({

          where: {

            headerId:
              headerIdInt,

            status:
              'use'
          },


          orderBy: {
            id:
              'asc'
          },


          include: {

            BoxIssueTemp: {

              select: {

                id:
                  true,

                headerId:
                  true,

                itemNo:
                  true,

                itemName:
                  true,

                wosNo:
                  true,

                dwg:
                  true,

                dieNo:
                  true,

                lotNo:
                  true,

                qty:
                  true,

                status:
                  true
              }
            }
          }
        });


    const fractionRows =
      fractionMaps

        .filter((map) => {

          return (
            map.BoxIssueTemp &&
            map.BoxIssueTemp.status === 'use'
          );

        })

        .map((map) => {

          return {

            id:
              map.BoxIssueTemp.id,

            headerId:
              map.BoxIssueTemp.headerId,

            itemNo:
              map.BoxIssueTemp.itemNo,

            itemName:
              map.BoxIssueTemp.itemName,

            wosNo:
              map.BoxIssueTemp.wosNo,

            dwg:
              map.BoxIssueTemp.dwg,

            dieNo:
              map.BoxIssueTemp.dieNo,

            lotNo:
              map.BoxIssueTemp.lotNo,

            qty:
              map.BoxIssueTemp.qty
          };

        });


    /* =====================================================
       FIRST DATA ROW

       ใช้แสดงข้อมูลส่วนหัว
    ===================================================== */

    const firstAnyRow =
      normalRows[0] ||
      fractionRows[0] ||
      null;


    /* =====================================================
       GROUP BY SHORT LOT NO
    ===================================================== */

    const groupMap =
      new Map();


    const addRowToGroup = (
      row,
      kind
    ) => {

      const shortLotNo =
        getShortLotNo(
          row.lotNo || ''
        );


      const key =
        shortLotNo || '-';


      if (!groupMap.has(key)) {

        groupMap.set(
          key,
          {

            lotNo:
              shortLotNo || '-',

            dwg:
              (row.dwg || '')
                .toString()
                .trim(),

            dieNo:
              (row.dieNo || '')
                .toString()
                .trim(),

            itemNo:
              (row.itemNo || '')
                .toString()
                .trim(),

            fullQtyList:
              [],

            partialQtyList:
              []
          }
        );
      }


      const target =
        groupMap.get(key);


      const qty =
        Number(
          row.qty || 0
        );


      if (kind === 'FULL') {

        target
          .fullQtyList
          .push(qty);

      } else {

        target
          .partialQtyList
          .push(qty);

      }
    };


    /* =====================================================
       NORMAL
    ===================================================== */

    normalRows.forEach(
      (row) => {

        addRowToGroup(
          row,
          'FULL'
        );

      }
    );


    /* =====================================================
       FRACTION
    ===================================================== */

    fractionRows.forEach(
      (row) => {

        addRowToGroup(
          row,
          'PARTIAL'
        );

      }
    );


    /* =====================================================
       PREPARE GROUP RESULT
    ===================================================== */

    let groupedRows =
      Array
        .from(
          groupMap.values()
        )

        .map(
          (
            group,
            index
          ) => {

            const fullQtyItems =
              qtyMultiplyList(
                group.fullQtyList
              );


            const partialQtyItems =
              qtyMultiplyList(
                group.partialQtyList
              );


            const fullTotal =
              group
                .fullQtyList
                .reduce(
                  (
                    sum,
                    qty
                  ) => {

                    return (
                      sum +
                      Number(qty || 0)
                    );

                  },
                  0
                );


            const partialTotal =
              group
                .partialQtyList
                .reduce(
                  (
                    sum,
                    qty
                  ) => {

                    return (
                      sum +
                      Number(qty || 0)
                    );

                  },
                  0
                );


            const totalQty =
              fullTotal +
              partialTotal;


            return {

              no:
                index + 1,

              lotNo:
                group.lotNo,

              dwg:
                group.dwg,

              dieNo:
                group.dieNo,

              itemNo:
                group.itemNo,

              fullBoxText:
                fullQtyItems.map(
                  (item) =>
                    item.text
                ),

              partialBoxText:
                partialQtyItems.map(
                  (item) =>
                    item.text
                ),

              totalQty:
                totalQty
            };
          }
        );


    /* =====================================================
       SORT LOT NO
    ===================================================== */

    groupedRows =
      groupedRows.sort(
        (
          a,
          b
        ) => {

          return String(
            a.lotNo
          ).localeCompare(
            String(
              b.lotNo
            ),
            undefined,
            {
              numeric:
                true,

              sensitivity:
                'base'
            }
          );
        }
      );


    /* =====================================================
       RE NUMBER
    ===================================================== */

    groupedRows =
      groupedRows.map(
        (
          row,
          index
        ) => {

          return {
            ...row,

            no:
              index + 1
          };

        }
      );


    /* =====================================================
       HEADER DATA
    ===================================================== */

    const itemNoForBarcode =
      firstAnyRow?.itemNo ||
      header.itemNo ||
      '';


    const idPallet =
      FIX_ID_PALLET;


    const oqcLotNo =
      FIX_OQC_LOT_NO;


    /* =====================================================
       TOP BARCODE

       DATA = ITEM NO
    ===================================================== */

    const topLeftBarcode =
      await generateBarcodeDataUrl(
        itemNoForBarcode,
        {
          scale:
            2.8,

          height:
            26
        }
      );


    /* =====================================================
       ID PALLET BARCODE
    ===================================================== */

    const idPalletBarcode =
      await generateBarcodeDataUrl(
        idPallet,
        {
          scale:
            2.2,

          height:
            16
        }
      );


    /* =====================================================
       GENERATE QR EACH LOT GROUP
    ===================================================== */

    const groupedRowsWithQr =
      [];


    for (
      const row
      of groupedRows
    ) {

      /* ==============================
         STOCK IN QR
      ============================== */

      const stockInQrText =
        buildStockInQrText({

          oqcLotNo:
            oqcLotNo,

          dieNo:
            row.dieNo || '',

          lotNo:
            row.lotNo || '',

          totalQty:
            row.totalQty || 0
        });


      /* ==============================
         ISSUE D/O QR
      ============================== */

      const issueDoQrText =
        buildIssueDoQrText({

          lotNo:
            row.lotNo || '',

          dieNo:
            row.dieNo || '',

          oqcLotNo:
            oqcLotNo,

          idPallet:
            idPallet
        });


      const stockInQr =
        await generateQrDataUrl(
          stockInQrText
        );


      const issueDoQr =
        await generateQrDataUrl(
          issueDoQrText
        );


      groupedRowsWithQr.push({

        ...row,

        stockInQrText:
          stockInQrText,

        issueDoQrText:
          issueDoQrText,

        stockInQr:
          stockInQr,

        issueDoQr:
          issueDoQr
      });
    }


    /* =====================================================
       PAGING

       1 PAGE = 5 ROW
    ===================================================== */

    const rowsPerPage =
      5;


    const pageGroups =
      groupedRowsWithQr.length > 0

        ? chunkArray(
            groupedRowsWithQr,
            rowsPerPage
          )

        : [
            []
          ];


    /* =====================================================
       GRAND TOTAL QTY

       Total ทั้ง Pallet
    ===================================================== */

    const grandTotalQty =
      groupedRowsWithQr.reduce(
        (
          sum,
          row
        ) => {

          return (
            sum +
            Number(
              row.totalQty || 0
            )
          );

        },
        0
      );


    /* =====================================================
       QTY CELL
    ===================================================== */

    const renderQtyCell =
      (items) => {

        if (
          !items ||
          !items.length
        ) {

          return `
            <div class="cell-line">
              -
            </div>
          `;
        }


        return items
          .map(
            (text) => {

              return `
                <div class="cell-line">
                  ${escapeHtml(text)}
                </div>
              `;

            }
          )
          .join('');
      };


    /* =====================================================
       EMPTY ROW

       ใช้เติมให้ครบ 5 Row
    ===================================================== */

    const renderEmptyRow =
      () => {

        return `
          <tr class="empty-row">

            <td>
              &nbsp;
            </td>

            <td>
              &nbsp;
            </td>

            <td>
              &nbsp;
            </td>

            <td>
              &nbsp;
            </td>

            <td>
              &nbsp;
            </td>

            <td>
              &nbsp;
            </td>

            <td>
              &nbsp;
            </td>

          </tr>
        `;
      };


    /* =====================================================
       TABLE ROW

       บังคับ Render 5 Row เสมอ
    ===================================================== */

    const renderTableRows =
      (rows) => {

        const htmlRows =
          [];


        for (
          let i = 0;
          i < rowsPerPage;
          i++
        ) {

          const row =
            rows[i];


          /* =========================
             Empty Slot
          ========================= */

          if (!row) {

            htmlRows.push(
              renderEmptyRow()
            );

            continue;
          }


          /* =========================
             Data Slot
          ========================= */

          htmlRows.push(`
            <tr class="data-row">


              <!-- NO -->

              <td class="row-no">

                ${escapeHtml(
                  row.no
                )}

              </td>


              <!-- LOT NO -->

              <td class="lot-cell">

                ${escapeHtml(
                  row.lotNo
                )}

              </td>


              <!-- FULL BOX -->

              <td class="box-cell">

                ${renderQtyCell(
                  row.fullBoxText
                )}

              </td>


              <!-- PARTIAL BOX -->

              <td class="box-cell">

                ${renderQtyCell(
                  row.partialBoxText
                )}

              </td>


              <!-- TOTAL QTY -->

              <td class="total-cell">

                ${escapeHtml(
                  formatNumber(
                    row.totalQty
                  )
                )}

              </td>


              <!-- STOCK IN -->

              <td class="qr-cell">

                <img
                  class="qr-img"
                  src="${row.stockInQr}"
                />

              </td>


              <!-- ISSUE D/O -->

              <td class="qr-cell">

                <img
                  class="qr-img"
                  src="${row.issueDoQr}"
                />

              </td>


            </tr>
          `);
        }


        return htmlRows.join('');
      };


    /* =====================================================
       RENDER ONE PAGE
    ===================================================== */

    const renderPage =
      (rows) => {

        const dwgNo =
          firstAnyRow?.dwg ||
          '';


        const dieNo =
          firstAnyRow?.dieNo ||
          '';


        const itemName =
          header.itemName ||
          '';


        const locationNo =
          location?.name ||
          '';


        const employeeText =
          `${header?.User?.empNo || ''} ${header?.User?.name || ''}`
            .trim();


        return `
          <section class="page">

            <div class="sheet">


              <!-- =================================================
                   HEADER AREA
              ================================================== -->

              <div class="header-area">


                <!-- =============================================
                     TOP
                ============================================== -->

                <div class="top-header">


                  <!-- ITEM BARCODE -->

                  <div class="barcode-wrap">

                    <img
                      class="top-barcode"
                      src="${topLeftBarcode}"
                    />

                  </div>


                  <!-- ITEM TEXT -->

                  <div class="top-center">

                    <div class="item-no">

                      ${escapeHtml(
                        itemNoForBarcode
                      )}

                    </div>


                    <div class="item-name">

                      ${escapeHtml(
                        itemName
                      )}

                    </div>

                  </div>


                  <!-- TYPE -->

                  <div class="top-type">

                    ${escapeHtml(
                      FIX_LABEL_TYPE
                    )}

                  </div>


                </div>



                <!-- =============================================
                     META
                ============================================== -->

                <div class="meta-grid">


                  <!-- LEFT -->

                  <div class="meta-left">


                    <div class="meta-row">

                      <span class="label">
                        Date :
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          formatDateDMY(
                            header.dateIssue
                          )
                        )}

                      </span>

                    </div>


                    <div class="meta-row">

                      <span class="label">
                        Location No :
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          locationNo
                        )}

                      </span>

                    </div>


                    <div class="meta-row">

                      <span class="label">
                        OQC Lot No :
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          oqcLotNo
                        )}

                      </span>

                    </div>


                    <div class="meta-row">

                      <span class="label">
                        Employee. :
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          employeeText
                        )}

                      </span>

                    </div>


                  </div>



                  <!-- CENTER -->

                  <div class="meta-middle">


                    <div class="meta-row">

                      <span class="label">
                        Dwg.No.
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          dwgNo
                        )}

                      </span>

                    </div>


                    <div class="meta-row">

                      <span class="label">
                        Die No.
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          dieNo
                        )}

                      </span>

                    </div>


                    <div class="meta-row">

                      <span class="label">
                        Total Qty
                      </span>

                      <span class="value">

                        ${escapeHtml(
                          formatNumber(
                            grandTotalQty
                          )
                        )}

                        <span class="pcs">
                          pcs
                        </span>

                      </span>

                    </div>


                    <div class="meta-row">

                      <span class="label">
                        Remark
                      </span>

                      <span class="value">
                        &nbsp;
                      </span>

                    </div>


                  </div>



                  <!-- RIGHT -->

                  <div class="meta-right">


                    <div class="id-barcode-wrap">

                      <img
                        class="id-barcode"
                        src="${idPalletBarcode}"
                      />

                    </div>


                    <div class="id-pallet-text">

                      ID Pallet :

                      <b>
                        ${escapeHtml(
                          idPallet
                        )}
                      </b>

                    </div>


                  </div>


                </div>


              </div>



              <!-- =================================================
                   TABLE AREA
              ================================================== -->

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

                    ${renderTableRows(
                      rows
                    )}

                  </tbody>


                </table>

              </div>



              <!-- =================================================
                   FOOTER
                   ล็อกไว้ล่างสุดของใบ
              ================================================== -->

              <div class="bottom-bar">


                <div class="bottom-left">

                  Normal movement within 3 month.

                  &nbsp;&nbsp;

                  If over, move within :

                  <b>

                    ${escapeHtml(
                      header.moveMentThreeMonth ||
                      '-'
                    )}

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
       ALL PAGES
    ===================================================== */

    const pagesHtml =
      pageGroups
        .map(
          (rows) => {

            return renderPage(
              rows
            );

          }
        )
        .join('');


    /* =====================================================
       FULL HTML
    ===================================================== */

    const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8" />

        <style>


          /* =================================================
             A4 LANDSCAPE

             297 x 210 mm
          ================================================= */

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



          /* =================================================
             PAGE
          ================================================= */

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



          /* =================================================
             SHEET

             ใช้ Flex Column
             เพื่อดัน Footer ลงล่างสุด
          ================================================= */

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



          /* =================================================
             HEADER AREA
          ================================================= */

          .header-area {

            flex:
              0 0 auto;

          }



          /* =================================================
             TOP HEADER
          ================================================= */

          .top-header {

            display:
              grid;

            grid-template-columns:
              300px
              minmax(0, 1fr)
              70px;

            align-items:
              start;

            column-gap:
              18px;

            margin-bottom:
              7px;

          }



          /* =================================================
             TOP BARCODE
          ================================================= */

          .barcode-wrap {

            padding-top:
              1px;

          }



          .top-barcode {

            display:
              block;

            width:
              285px;

            height:
              64px;

            object-fit:
              fill;

          }



          /* =================================================
             ITEM
          ================================================= */

          .top-center {

            padding-top:
              3px;

          }



          .item-no {

            font-size:
              23px;

            line-height:
              1.05;

            font-weight:
              800;

            margin-bottom:
              8px;

          }



          .item-name {

            font-size:
              21px;

            line-height:
              1.05;

            font-weight:
              800;

            word-break:
              break-word;

          }



          /* =================================================
             FG / WIP
          ================================================= */

          .top-type {

            text-align:
              right;

            font-size:
              30px;

            line-height:
              1;

            font-weight:
              900;

            padding-top:
              6px;

          }



          /* =================================================
             META
          ================================================= */

          .meta-grid {

            display:
              grid;

            grid-template-columns:
              1.12fr
              1fr
              0.92fr;

            column-gap:
              24px;

            align-items:
              start;

            margin-top:
              2px;

            margin-bottom:
              10px;

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
              24px;

            margin-bottom:
              5px;

          }



          .meta-row .label {

            color:
              #64748b;

            font-size:
              16px;

            line-height:
              1.2;

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
              1.2;

            font-weight:
              800;

            word-break:
              break-word;

          }



          .pcs {

            margin-left:
              5px;

            font-size:
              14px;

          }



          /* =================================================
             ID PALLET
          ================================================= */

          .meta-right {

            display:
              flex;

            flex-direction:
              column;

            align-items:
              flex-start;

            justify-content:
              center;

            padding-top:
              12px;

          }



          .id-barcode-wrap {

            margin:
              12px 0 5px;

          }



          .id-barcode {

            display:
              block;

            width:
              215px;

            height:
              43px;

            object-fit:
              fill;

          }



          .id-pallet-text {

            font-size:
              15px;

            line-height:
              1.2;

          }



          /* =================================================
             TABLE AREA

             กินพื้นที่ที่เหลือ
             แต่เหลือที่ Footer ด้านล่าง
          ================================================= */

          .table-area {

            flex:
              1 1 auto;

            min-height:
              0;

            display:
              flex;

            flex-direction:
              column;

          }



          .main-table {

            width:
              100%;

            height:
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



          /* =================================================
             TABLE HEADER
          ================================================= */

          .main-table thead {

            height:
              31px;

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



          /* =================================================
             TABLE BODY

             5 แถวเท่ากัน
             ขยายให้เต็มพื้นที่
          ================================================= */

          .main-table tbody {

            height:
              calc(100% - 31px);

          }



          .main-table tbody tr {

            height:
              20%;

          }



          .main-table td {

            padding:
              7px 7px;

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



          /* =================================================
             COLUMN WIDTH
          ================================================= */

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



          /* =================================================
             DATA ALIGN
          ================================================= */

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



          /* =================================================
             QR
          ================================================= */

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



          /* =================================================
             EMPTY ROW
          ================================================= */

          .empty-row td {

            background:
              #fff;

          }



          /* =================================================
             FOOTER

             margin-top:auto ทำให้ติดด้านล่าง
          ================================================= */

          .bottom-bar {

            flex:
              0 0 auto;

            min-height:
              28px;

            margin-top:
              auto;

            padding:
              8px 2px 0;

            display:
              flex;

            align-items:
              flex-end;

            justify-content:
              space-between;

            column-gap:
              20px;

          }



          .bottom-left {

            color:
              #64748b;

            font-size:
              15px;

            line-height:
              1.2;

            white-space:
              nowrap;

          }



          .bottom-left b {

            color:
              #111;

            font-weight:
              800;

          }



          .bottom-right {

            color:
              #111;

            font-size:
              14px;

            line-height:
              1.2;

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
       CREATE BROWSER
    ===================================================== */

    browser =
      await puppeteer.launch({

        headless:
          true,

        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });


    const page =
      await browser.newPage();


    /* =====================================================
       SET HTML
    ===================================================== */

    await page.setContent(
      html,
      {
        waitUntil:
          'networkidle0'
      }
    );


    /* =====================================================
       WAIT FONT + IMAGE
    ===================================================== */

    await page.evaluate(
      async () => {

        /* =========================
           FONT
        ========================= */

        if (
          document.fonts?.ready
        ) {

          await document
            .fonts
            .ready;

        }


        /* =========================
           IMAGE
        ========================= */

        const images =
          Array.from(
            document.images
          );


        await Promise.all(

          images.map(
            (img) => {

              if (
                img.complete
              ) {

                return Promise.resolve();

              }


              return new Promise(
                (resolve) => {

                  img.onload =
                    resolve;

                  img.onerror =
                    resolve;

                }
              );

            }
          )

        );

      }
    );


    /* =====================================================
       CREATE PDF
    ===================================================== */

    const pdfBuffer =
      await page.pdf({

        format:
          'A4',

        landscape:
          true,

        printBackground:
          true,

        preferCSSPageSize:
          true,

        margin: {

          top:
            '5mm',

          right:
            '5mm',

          bottom:
            '5mm',

          left:
            '5mm'
        }
      });


    /* =====================================================
       RESPONSE
    ===================================================== */

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );


    res.setHeader(
      'Content-Disposition',
      'inline; filename="FullLabel.pdf"'
    );


    return res.send(
      pdfBuffer
    );


  } catch (error) {

    console.error(
      'printFullLabel error:',
      error
    );


    return res
      .status(500)
      .send({

        error:
          error?.message ||
          'Cannot generate full label PDF'

      });


  } finally {

    if (browser) {

      await browser.close();

    }

  }
},





    

}
