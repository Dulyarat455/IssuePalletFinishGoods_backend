// const {PrismaClient} = require('../generated/prisma');
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const jwt = require('jsonwebtoken')

module.exports = {

   create: async (req,res) => {
        try{
            const {name, empNo, password, rfId, 
              role, sectionId, groupId} = req.body;

            if (!name || !empNo || !password || !rfId ||
              !role || sectionId == null || groupId == null
            ) {
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

              const result = await prisma.$transaction(async (tx) => {

                  const user = await tx.user.create({
                    data: {
                      name: name,
                      empNo: empNo,
                      password: password,
                      rfId: rfId ,
                      role: role
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
                      userId: user.id 
                    },
                  });

                  return {
                    user,
                    mapGroupSectionUser
                  }
            })

            return res.send({
                message: 'create_user_success',
                data: result,
            });

        }catch(e){
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
            status: 'use',
            id: {
              gt: lastId,
            },
          },
          orderBy: {
            id: 'asc',
          },
          take: chunkSize,
          select: {
            id: true,
            name: true,
            empNo: true,
            rfId: true,
            role: true,
            status: true,
            password:true,
  
            MapGroupSectionUser: {
              where: {
                status: 'use',
              },
              orderBy: {
                id: 'asc',
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
            groupName: mapRow?.Group?.name || '-',
  
            sectionId: mapRow?.sectionId || null,
            sectionName: mapRow?.Section?.name || '-',
  
            // เผื่ออนาคต 1 user มีหลาย group/section
            mapGroupSectionUsers: user.MapGroupSectionUser.map((item) => ({
              id: item.id,
              userId: item.userId,
  
              groupId: item.groupId,
              groupName: item.Group?.name || '-',
  
              sectionId: item.sectionId,
              sectionName: item.Section?.name || '-',
  
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


   signIn: async (req,res) => {
     try{
      const { empNo, password } = req.body;

      if (!empNo || !password){
        return res.status(400).send({ message: 'missing_empNo_or_password' });
      }


      const u = await prisma.user.findFirst({
        where: {
          empNo: String(empNo).trim(),
          password: String(password),
          status: 'use',
        },
        include: {
          MapGroupSectionUser: {
            where: {
              status: 'use',
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
        return res.status(401).send({ message: 'unauthorized' });
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
        return res.status(500).send({ message: 'missing_SECRET_KEY' });
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
        { expiresIn: '30d' }
      );

      return res.send({ token, ...payload });

     }catch(e){
       return res.status(500).send({ error: e.message });
     }
   },





}

