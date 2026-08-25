const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();


module.exports = {
    addRack: async (req,res) =>{
        try{
            const { name } = req.body;

            if (!name) {
              return res.status(400).send({ message: 'missing_required_fields' });
            }

            const checkRack = await prisma.rack.findFirst({
                where: {
                  name: name,
                  status: 'use',
                },
              });

              if (checkRack) {
                return res.status(400).send({ message: 'rack_name_already' });
              }  


              const createRack = await prisma.rack.create({
                data: {
                  name: name
                }
              });

            return res.send({
                message: 'add_rack_success',
                data: createRack,
            });

        }catch(e){
            return res.status(500).send({ error: e.message });
        }
    },


    addArea: async (req,res)=>{
      try{
        const { name } = req.body;

        if (!name) {
          return res.status(400).send({ message: 'missing_required_fields' });
        }

        const checkArea = await prisma.area.findFirst({
            where: {
              name: name,
              status: 'use',
            },
          });

          if (checkArea) {
            return res.status(400).send({ message: 'area_name_already' });
          }  


          const createArea = await prisma.area.create({
            data: {
              name: name
            }
          });

        return res.send({
            message: 'add_area_success',
            data: createArea,
        });
      }catch(e){
        return res.status(500).send({ error: e.message });
      }
    },


    mapAreaRack: async (req,res)=> {
      try{
          const {rackId, areaId} = req.body;

          if (rackId == null || areaId == null) {
            return res.status(400).send({ message: 'missing_required_fields' });
          }

          const checkMapAreaRack = await prisma.mapAreaRack.findFirst({
            where: {
              rackId: parseInt(rackId),
              areaId: parseInt(areaId),
              status: 'use',
            },
          });

          if (checkMapAreaRack) {
            return res.status(400).send({ message: 'Map_areaRack_already' });
          }  

          const createMapAreaRack = await prisma.mapAreaRack.create({
            data: {
              rackId: parseInt(rackId),
              areaId: parseInt(areaId)
            }
          });

        return res.send({
            message: 'add_area_success',
            data: createMapAreaRack,
        });

      }catch(e){
        return res.status(500).send({ error: e.message });
      }
    },





    mapAreaRackTwo: async (req, res) => {
      try {
        const {
          rackId,
          areaIdStart,
          areaIdEnd
        } = req.body;
    
        /* =========================
           VALIDATE
        ========================= */
    
        if (
          rackId == null ||
          areaIdStart == null ||
          areaIdEnd == null
        ) {
          return res.status(400).send({
            message: 'missing_required_fields'
          });
        }
    
        const rackIdNumber = parseInt(rackId);
        const start = parseInt(areaIdStart);
        const end = parseInt(areaIdEnd);
    
        if (
          Number.isNaN(rackIdNumber) ||
          Number.isNaN(start) ||
          Number.isNaN(end)
        ) {
          return res.status(400).send({
            message: 'invalid_number'
          });
        }
    
        if (start > end) {
          return res.status(400).send({
            message: 'areaIdStart_must_less_than_or_equal_areaIdEnd'
          });
        }
    
        /* =========================
           CREATE AREA ID LIST
        ========================= */
    
        const areaIds = [];
    
        for (
          let areaId = start;
          areaId <= end;
          areaId++
        ) {
          areaIds.push(areaId);
        }
    
        /* =========================
           CHECK EXISTING
        ========================= */
    
        const existingRows =
          await prisma.mapAreaRack.findMany({
            where: {
              rackId: rackIdNumber,
    
              areaId: {
                in: areaIds
              },
    
              status: 'use'
            },
    
            select: {
              areaId: true
            }
          });
    
        const existingAreaIds =
          new Set(
            existingRows.map(
              row => Number(row.areaId)
            )
          );
    
        /* =========================
           FILTER ONLY NEW DATA
        ========================= */
    
        const createRows =
          areaIds
            .filter(
              areaId =>
                !existingAreaIds.has(areaId)
            )
            .map(
              areaId => ({
                rackId: rackIdNumber,
                areaId: areaId
              })
            );
    
        /* =========================
           CREATE
        ========================= */
    
        let createdCount = 0;
    
        if (createRows.length > 0) {
          const result =
            await prisma.mapAreaRack.createMany({
              data: createRows
            });
    
          createdCount =
            result.count || 0;
        }
    
        /* =========================
           RESPONSE
        ========================= */
    
        return res.send({
          message: 'add_area_success',
    
          rackId: rackIdNumber,
    
          areaIdStart: start,
          areaIdEnd: end,
    
          totalRequested: areaIds.length,
    
          createdCount: createdCount,
    
          skippedCount:
            existingAreaIds.size,
    
          existingAreaIds:
            Array.from(
              existingAreaIds
            )
        });
    
      } catch (e) {
        return res.status(500).send({
          error: e.message
        });
      }
    },



    list: async (req, res) => {
      try {
        const racks = await prisma.rack.findMany({
          where: {
            status: 'use'
          },
    
          orderBy: {
            id: 'asc'
          },
    
          include: {
            MapAreaRack: {
              where: {
                status: 'use',
                Area: {
                  status: 'use'
                }
              },
    
              orderBy: {
                areaId: 'asc'
              },
    
              include: {
                Area: true
              }
            }
          }
        });
    
        const results = racks.map((rack) => ({
          rackId: rack.id,
          rackName: rack.name,
    
          areas: rack.MapAreaRack.map((map) => ({
            areaId: map.Area.id,
            areaName: map.Area.name
          }))
        }));
    
        return res.send({
          results: results
        });
    
      } catch (e) {
        return res.status(500).send({
          error: e.message
        });
      }
    },

}