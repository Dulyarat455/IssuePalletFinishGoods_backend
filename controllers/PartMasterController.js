const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
    add: async (req,res) =>{
        try{
            const { itemNo, itemName, itemClass, lotSize } = req.body;
            if (
                !itemNo  ||
                !itemName ||
                !itemClass ||
                lotSize == null
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
                  itemClass: itemClass,
                  lotSize: parseInt(lotSize)
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
        const chunkSize = 500;
        let skip = 0;
        let allRows = [];
    
        while (true) {
          const rows = await prisma.partMaster.findMany({
            where: {
              status: 'use',
            },
            orderBy: {
              itemNo: 'asc',
            },
            skip: skip,
            take: chunkSize,
          });
    
          allRows.push(...rows);
    
          if (rows.length < chunkSize) {
            break;
          }
    
          skip += chunkSize;
        }
    
        return res.send({
          results: allRows,
          total: allRows.length,
          chunkSize: chunkSize,
        });
    
      } catch (e) {
        return res.status(500).send({
          error: e.message,
        });
      }
    },

    syncMasterPbass: async (req, res) => {
      try {
        const baseUrl = process.env.PBASS_API_URL;
        const token = process.env.PBASS_TOKEN;
        const chunkSize = 500;
    
        if (!baseUrl) {
          return res.status(500).send({
            message: 'missing_pbass_api_url'
          });
        }
    
        if (!token) {
          return res.status(500).send({
            message: 'missing_pbass_token'
          });
        }
    
        /* =====================================================
           HELPER
        ===================================================== */
    
        const toText = (value) =>
          value == null ? '' : String(value).trim();
    
        const toNullableInt = (value) => {
          if (
            value === null ||
            value === undefined ||
            value === ''
          ) {
            return null;
          }
    
          const n = Number(value);
    
          return Number.isFinite(n)
            ? Math.trunc(n)
            : null;
        };
    
        const chunkArray = (arr, size) => {
          const result = [];
    
          for (let i = 0; i < arr.length; i += size) {
            result.push(
              arr.slice(i, i + size)
            );
          }
    
          return result;
        };
    
        const allowedItemClasses = new Set([
          'L',
          'G',
          'S'
        ]);
    
        /* =====================================================
           BUILD PBASS URL
    
           ปีปัจจุบัน - 1
    
           เช่น:
           ปีปัจจุบัน = 2026
           targetYear = 2025
    
           ENV:
           https://xxxx/F/ALL/Y/
    
           Result:
           https://xxxx/F/ALL/Y/2025
        ===================================================== */
    
        const currentYear =
          new Date().getFullYear();
    
        const targetYear =
          currentYear - 1;
    
        const normalizedBaseUrl =
          baseUrl.endsWith('/')
            ? baseUrl
            : `${baseUrl}/`;
    
        const requestUrl =
          `${normalizedBaseUrl}${targetYear}`;
    
        console.log(
          'PBASS Master URL =',
          requestUrl
        );
    
        /* =====================================================
           CALL PBASS
        ===================================================== */
    
        const response = await fetch(
          requestUrl,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: '*/*'
            }
          }
        );
    
        const rawText =
          await response.text();
    
        if (!response.ok) {
          return res
            .status(response.status)
            .send({
              message:
                'pbass_master_fetch_failed',
    
              requestUrl,
    
              error:
                rawText
            });
        }
    
        /* =====================================================
           PARSE RESPONSE
        ===================================================== */
    
        let data;
    
        try {
          data =
            JSON.parse(rawText);
    
        } catch (parseError) {
          return res
            .status(500)
            .send({
              message:
                'pbass_master_parse_failed',
    
              error:
                parseError.message,
    
              raw:
                rawText.slice(0, 2000),
    
              requestUrl
            });
        }
    
        const rows =
          Array.isArray(data?.Data)
            ? data.Data
            : Array.isArray(data)
              ? data
              : [];
    
        /* =====================================================
           NORMALIZE + FILTER
           ITEM_CLASS = L / G / S
        ===================================================== */
    
        const normalizedRows = [];
    
        let filteredItemClassCount = 0;
        let invalidItemNoCount = 0;
    
        for (const item of rows) {
          const itemNo =
            toText(item.ITEM_NO);
    
          const itemName =
            toText(item.ITEM_NAME);
    
          const itemClass =
            toText(
              item.ITEM_CLASS
            ).toUpperCase();
    
          const lotSize =
            toNullableInt(
              item.LOT_SIZE
            );
    
          if (!itemNo) {
            invalidItemNoCount++;
            continue;
          }
    
          if (
            !allowedItemClasses.has(
              itemClass
            )
          ) {
            filteredItemClassCount++;
            continue;
          }
    
          normalizedRows.push({
            itemNo,
            itemName,
            itemClass,
            lotSize
          });
        }
    
        /* =====================================================
           REMOVE DUPLICATE ITEM_NO
    
           ถ้าซ้ำใน PBASS
           ใช้ข้อมูลตัวสุดท้าย
        ===================================================== */
    
        const uniqueMap =
          new Map();
    
        let duplicateInPayloadCount =
          0;
    
        for (const item of normalizedRows) {
          if (
            uniqueMap.has(
              item.itemNo
            )
          ) {
            duplicateInPayloadCount++;
          }
    
          uniqueMap.set(
            item.itemNo,
            item
          );
        }
    
        const uniqueRows =
          Array.from(
            uniqueMap.values()
          );
    
        /* =====================================================
           LOAD EXISTING PART MASTER
           CHUNK 500
        ===================================================== */
    
        const itemNos =
          uniqueRows.map(
            item => item.itemNo
          );
    
        const itemNoChunks =
          chunkArray(
            itemNos,
            chunkSize
          );
    
        const existingMap =
          new Map();
    
        for (const chunk of itemNoChunks) {
          if (!chunk.length) {
            continue;
          }
    
          const existingRows =
            await prisma.partMaster.findMany({
              where: {
                itemNo: {
                  in: chunk
                },
                status: 'use'
              },
              select: {
                id: true,
                itemNo: true,
                itemName: true,
                itemClass: true,
                lotSize: true
              }
            });
    
          for (const row of existingRows) {
            existingMap.set(
              toText(row.itemNo),
              row
            );
          }
        }
    
        /* =====================================================
           CHECK CREATE / UPDATE / SKIP
        ===================================================== */
    
        const createItems = [];
        const updateItems = [];
    
        let skippedCount = 0;
    
        for (const item of uniqueRows) {
          const existing =
            existingMap.get(
              item.itemNo
            );
    
          /* ไม่มี itemNo -> CREATE */
          if (!existing) {
            createItems.push({
              itemNo:
                item.itemNo,
    
              itemName:
                item.itemName,
    
              itemClass:
                item.itemClass,
    
              lotSize:
                item.lotSize,
    
              status:
                'use'
            });
    
            continue;
          }
    
          /* ===============================================
             CHECK FIELD
          ================================================ */
    
          const sameItemName =
            toText(
              existing.itemName
            ) ===
            item.itemName;
    
          const sameItemClass =
            toText(
              existing.itemClass
            ).toUpperCase() ===
            item.itemClass;
    
          const existingLotSize =
            existing.lotSize == null
              ? null
              : Number(
                  existing.lotSize
                );
    
          const sameLotSize =
            existingLotSize ===
            item.lotSize;
    
          /* เหมือนหมด -> SKIP */
          if (
            sameItemName &&
            sameItemClass &&
            sameLotSize
          ) {
            skippedCount++;
            continue;
          }
    
          /* ต่าง -> UPDATE ตาม PBASS */
          updateItems.push({
            id:
              existing.id,
    
            itemName:
              item.itemName,
    
            itemClass:
              item.itemClass,
    
            lotSize:
              item.lotSize
          });
        }
    
        /* =====================================================
           CREATE
           CHUNK 500
        ===================================================== */
    
        const createChunks =
          chunkArray(
            createItems,
            chunkSize
          );
    
        let createdCount = 0;
    
        for (const chunk of createChunks) {
          if (!chunk.length) {
            continue;
          }
    
          const result =
            await prisma.partMaster.createMany({
              data: chunk
            });
    
          createdCount +=
            result.count || 0;
        }
    
        /* =====================================================
           UPDATE
           CHUNK 500
        ===================================================== */
    
        const updateChunks =
          chunkArray(
            updateItems,
            chunkSize
          );
    
        let updatedCount = 0;
    
        for (const chunk of updateChunks) {
          if (!chunk.length) {
            continue;
          }
    
          await Promise.all(
            chunk.map(item =>
              prisma.partMaster.update({
                where: {
                  id: item.id
                },
                data: {
                  itemName:
                    item.itemName,
    
                  itemClass:
                    item.itemClass,
    
                  lotSize:
                    item.lotSize
                }
              })
            )
          );
    
          updatedCount +=
            chunk.length;
        }
    
        /* =====================================================
           RESPONSE
        ===================================================== */
    
        return res.send({
          message:
            'Sync Part Master from PBASS success',
    
          requestUrl,
    
          currentYear,
          targetYear,
    
          totalFromPbass:
            rows.length,
    
          validRows:
            normalizedRows.length,
    
          uniqueRows:
            uniqueRows.length,
    
          createdCount,
          updatedCount,
          skippedCount,
    
          invalidItemNoCount,
          filteredItemClassCount,
          duplicateInPayloadCount,
    
          chunkSize,
    
          totalFindChunks:
            itemNoChunks.length,
    
          totalCreateChunks:
            createChunks.length,
    
          totalUpdateChunks:
            updateChunks.length
        });
    
      } catch (e) {
        console.error(
          'syncMasterPbass error:',
          e
        );
    
        return res.status(500).send({
          message:
            'sync_master_pbass_failed',
    
          error:
            e.message
        });
      }
    },



    delete: async (req,res) =>{
      try{
      const {partMasterId} = req.body;



      const existing = await prisma.partMaster.findFirst({
        where: {
          id: parseInt(partMasterId),
          status: 'use'
        },
       
      });
  
      if (!existing) {
        return res.status(404).send({ message: 'partMaster_not_found' });
      }



      const deleted = await prisma.partMaster.delete({
        where: { 
          id: parseInt(partMasterId) 
        },
      });


      return res.send({
        message: 'delete_partMaster_success',
        data: deleted
      });


      }catch(e){
        return res.status(500).send({ error: e.message });
      }
    },


  updateMaster: async (req, res) => {
    try {
      const {
        partMasterId,
        itemNo,
        itemName,
        itemClass,
        lotSize
      } = req.body;

      const existing = await prisma.partMaster.findFirst({
        where: {
          id: parseInt(partMasterId),
          status: 'use'
        }
      });

      if (!existing) {
        return res.status(404).send({
          message: 'partMaster_not_found'
        });
      }

      const updatePartMaster = await prisma.partMaster.update({
        where: {
          id: parseInt(partMasterId)
        },

        data: {
          itemNo: itemNo,
          itemName: itemName,
          itemClass: itemClass,
          lotSize: parseInt(lotSize),

          // update เวลาเป็นเวลาปัจจุบัน
          timeStmp: new Date()
        }
      });

      return res.send({
        message: 'edit_partMaster_success',
        data: updatePartMaster
      });

    } catch (e) {
      return res.status(500).send({
        error: e.message
      });
    }
},


    

      
}

