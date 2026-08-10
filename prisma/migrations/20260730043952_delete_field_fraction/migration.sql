/*
  Warnings:

  - You are about to drop the column `totalBox` on the `HeaderIssueFraction` table. All the data in the column will be lost.
  - You are about to drop the column `totalBox` on the `HeaderIssueTempFraction` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueFraction] DROP COLUMN [totalBox];

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTempFraction] DROP COLUMN [totalBox];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
