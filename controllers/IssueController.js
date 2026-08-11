const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();


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


    

}
