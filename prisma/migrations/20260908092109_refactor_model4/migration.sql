/*
  Warnings:

  - You are about to drop the column `headerClosedId` on the `Box` table. All the data in the column will be lost.
  - You are about to drop the column `headerIssueId` on the `Box` table. All the data in the column will be lost.
  - You are about to drop the column `closedNO` on the `HeaderClosed` table. All the data in the column will be lost.
  - Added the required column `headId` to the `Box` table without a default value. This is not possible if the table is not empty.
  - Added the required column `closedNo` to the `HeaderClosed` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headId` to the `HeaderClosedTemp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `HeaderClosedTemp` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Box] DROP COLUMN [headerClosedId],
[headerIssueId];
ALTER TABLE [dbo].[Box] ADD [headClosedId] INT,
[headId] INT NOT NULL,
[timeStmp] DATETIME2 NOT NULL CONSTRAINT [Box_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[HeaderClosed] DROP COLUMN [closedNO];
ALTER TABLE [dbo].[HeaderClosed] ADD [closedNo] NVARCHAR(1000) NOT NULL,
[timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderClosed_timeStmp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[HeaderClosedTemp] ADD [headId] INT NOT NULL,
[timeStmp] DATETIME2 NOT NULL CONSTRAINT [HeaderClosedTemp_timeStmp_df] DEFAULT CURRENT_TIMESTAMP,
[userId] INT NOT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[Box] ADD CONSTRAINT [Box_headId_fkey] FOREIGN KEY ([headId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderClosedTemp] ADD CONSTRAINT [HeaderClosedTemp_boxId_fkey] FOREIGN KEY ([boxId]) REFERENCES [dbo].[Box]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderClosedTemp] ADD CONSTRAINT [HeaderClosedTemp_headId_fkey] FOREIGN KEY ([headId]) REFERENCES [dbo].[HeaderIssue]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[HeaderClosedTemp] ADD CONSTRAINT [HeaderClosedTemp_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
