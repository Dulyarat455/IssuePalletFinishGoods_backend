const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();


module.exports = {
    add: async (req,res) =>{
        try{
            const { name } = req.body;

            if (!name) {
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const checkLocation = await prisma.location.findFirst({
                where: {
                  name: name,
                  status: 'use',
                },
              });

              if (checkLocation) {
                return res.status(400).send({ message: 'Location_name_already' });
              }  


              const location = await prisma.location.create({
                data: {
                  name: name
                }
              });

            return res.send({
                message: 'add_location_success',
                data: location,
            });

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },


    list: async (req, res) => {
      try{
          const rows = await prisma.location.findMany({
              where: {
                status: 'use'
              }
          })
          return res.send({ results: rows })
  
      }catch(e){
          return res.status(500).send({ error: e.message });
      }
  
    },

}