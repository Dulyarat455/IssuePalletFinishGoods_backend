const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    add: async (req,res) =>{
        try{
            const { itemNo, itemName } = req.body;
            if (
                !itemNo  ||
                !itemName 
              ) {
                return res.status(400).send({ message: 'missing_required_fields' });
              }

            //check  
            const checkPartMaster = await prisma.partMaster.findFirst({
                where: {
                  itemNo: itemNo,
                  itemName: itemName,
                  status: 'use',
                },
              });

              if (checkPartMaster) {
                return res.status(400).send({ message: 'Part_Master_already', data: checkPartMaster});
              }
              
              
              const partMaster = await prisma.partMaster.create({
                data: {
                  itemNo: itemNo ,
                  itemName: itemName,
                }
              });

              return res.send({
                message: 'add_partMaster_success',
                data: partMaster,
            });   

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },


    list: async (req, res) => {
      try {
        const rows = await prisma.partMaster.findMany({
          where: {
            status: 'use',
          },
          orderBy: {
            itemNo: 'asc',
          },
          select: {
            id: true,
            itemNo: true,
            itemName: true,
            status: true,
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
    }

      
}

