/*
  Warnings:

  - You are about to drop the column `dateIssue` on the `HeaderIssueTemp` table. All the data in the column will be lost.
  - You are about to drop the column `qtyBox` on the `HeaderIssueTemp` table. All the data in the column will be lost.
  - You are about to drop the column `shift` on the `HeaderIssueTemp` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTemp] DROP COLUMN [dateIssue],
[qtyBox],
[shift];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
