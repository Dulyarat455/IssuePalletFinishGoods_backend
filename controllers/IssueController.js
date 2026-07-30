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


    fetchBoxTempByHeadId : async (req,res) =>{
      try{
          const {headerId} = req.body;

          const rows = await prisma.boxIssueTemp.findMany({
            where: {
                status: 'use',
                headerId: parseInt(headerId)
            },
            select:{
              id: true,
              headerId: true,
              itemNo: true,
              itemName: true,
              wosNo: true,
              dwg: true,
              dieNo: true,
              lotNo: true,
              qty: true
            }
        })
        return res.send({ results: rows })


      }catch(e){
          return res.status(500).send({ error: e.message });
      }
  },




  editHeaderTemp: async (req,res) =>{ 
    try{
        const { 
          headTempId, dateIssue, itemNo, itemName, qtyBox, shift,
          groupId, controlLotId, locationId, totalBox,
          moveMentThreeMonth, userId  
        } = req.body;

        if (
            headTempId == null || 
            userId == null ||
            groupId == null ||
            !shift || 
            controlLotId == null ||
            !itemNo  ||
            !itemName  ||
            qtyBox == null ||
            dateIssue == null ||
            locationId == null ||
            totalBox == null || 
            !moveMentThreeMonth

          ) {
            return res.status(400).send({ message: 'missing_required_fields' });
          }


          const newDateIssue = new Date(dateIssue);
          if (isNaN(newDateIssue.getTime())) {
            return res.status(400).send({ message: 'invalid_dateIssue' });
          }

          
          // update headTemp issue
          const headerIssueTemp = await prisma.headerIssueTemp.update({
              where:{
                  id: parseInt(headTempId)
              },
            data: {
              userId: parseInt(userId),
              groupId: parseInt(groupId),
              venderId: parseInt(venderId),
              controlLotId: parseInt(controlLotId),
              sentDateByUser: sentDate,
              shift,
              itemNo,
              itemName,
              qtyBox: parseInt(qtyBox),
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



    

}
