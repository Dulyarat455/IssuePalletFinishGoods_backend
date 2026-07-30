const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();


module.exports = {

    add: async (req,res) =>{
        try{
            const { name,role } = req.body;

            if (!name) {
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const checkGroup = await prisma.group.findFirst({
                where: {
                  name: name,
                  status: 'use',
                },
              });

              if (checkGroup) {
                return res.status(400).send({ message: 'Group_name_already' });
              }  


              const group = await prisma.group.create({
                data: {
                  name: name
                },
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              });

            return res.send({
                message: 'add_group_success',
                data: group,
            });

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },


    list: async (req, res) => {
      try{
          const rows = await prisma.group.findMany({
              where: {
                status: 'use'
              }
          })
          return res.send({ results: rows })
  
      }catch(e){
          return res.status(500).send({ error: e.message });
      }
  
    },


    edit: async (req, res) => {
      try{

        const {
          id,
          empNo,
          name,
          role,
          rfId,
          password,
          groupId,
          sectionId
        } = req.body || {};


        if (
          id == null ||
          empNo == null ||
          name == null ||
          role == null ||
          rfId == null ||
          password == null ||
          groupId == null ||
          sectionId == null
        ) {
          return res.status(400).send({ message: 'missing_required_fields' });
        }


        const existing = await prisma.user.findFirst({
          where: { id: userId, status: 'use' },
          select: { id: true, empNo: true, name: true, rfId: true }
        });

        if (!existing) {
          return res.status(404).send({ message: 'user_not_found' });
        }


        const duplicate = await prisma.user.findFirst({
          where: {
            id: { not: userId },
            status: 'use',
            OR: [
              { empNo: empNoStr },
              { name: nameStr },
              { rfId: rfIdStr }
            ]
          },
          select: { empNo: true, name: true, rfId: true }
        });


        if (duplicate) {
          return res.status(400).send({
            message: 'user_already_exists',
            detail: {
              empNo: duplicate.empNo === empNoStr,
              name: duplicate.name === nameStr,
              rfId: duplicate.rfId === rfIdStr
            }
          });
        }



      }catch(e){
        return res.status(500).send({ error: e.message });
      }
    }


}