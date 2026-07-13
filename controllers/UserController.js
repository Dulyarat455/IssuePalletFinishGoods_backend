// const {PrismaClient} = require('../generated/prisma');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();


module.exports = {

   create: async (req,res) => {
        try{
            const {name, empNo, password} = req.body;

          
            if (!name || !empNo || !password) {
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const checkUser = await prisma.user.findFirst({
                where: {
                  empNo: empNo ,
                  status: 'use',
                },
              });

              if (checkUser) {
                return res.status(400).send({ message: 'User_name_already' });
              }  


              const user = await prisma.user.create({
                data: {
                  name: name,
                  empNo: empNo,
                  password: password
                },
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              });

            return res.send({
                message: 'create_user_success',
                data: user,
            });

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
   }


}

