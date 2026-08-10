/*
  Warnings:

  - Added the required column `headerId` to the `HeaderIssueFraction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headerId` to the `HeaderIssueTempFraction` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueFraction] ADD [headerId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[HeaderIssueTempFraction] ADD [headerId] INT NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderIssueTempFraction] ADD CONSTRAINT [HeaderIssueTempFraction_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssueTemp]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderIssueFraction] ADD CONSTRAINT [HeaderIssueFraction_headerId_fkey] FOREIGN KEY ([headerId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
