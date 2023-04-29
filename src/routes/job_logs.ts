// import express from 'express';
// import { databaseService } from '../shared/database_service';
// import jwt from 'jsonwebtoken';
// import { Constants } from '../shared/constants';
//
// const router = express.Router();
// router.use(express.urlencoded({ extended: false }));
// router.use(express.json());
//
// // middleware that is specific to this router
// router.use((req, res, next) => {
//   console.log(`Time: ${Date.now()}`);
//
//   // verify JWT
//
//   const tokenFromHeader = req.headers["x-access-token"];
//
//   if (!tokenFromHeader) {
//     return res.sendStatus(403);
//   }
//
//   const token = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader;
//
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   jwt.verify(token, Constants.jwtSecret, (err: any, decoded: any) => {
//     if (err) {
//       return res.sendStatus(401);
//     }
//     res.locals.userIdFromToken = decoded.id;
//     res.locals.token = token;
//     next();
//   });
// });
//
// /**
//  * Get all job logs from that were scheduled max 30 days ago.
//  */
// router.get('/:userId([a-zA-Z0-9]{24})', async (req, res) => {
//   const userId = req.params.userId;
//
//   if (!res.locals.userIdFromToken || !userId) {
//     return res.sendStatus(400);
//   }
//
//   if (res.locals.userIdFromToken !== userId) {
//     return res.sendStatus(401);
//   }
//
//   const jobLogs = await databaseService.getJobLogsByUserId(userId);
//   return res.send(jobLogs);
// });
//
// module.exports = router;