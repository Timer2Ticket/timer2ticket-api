// import express from 'express';
// import { databaseService } from '../shared/database_service';
// import jwt from 'jsonwebtoken';
// import superagent from 'superagent';
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
// router.post('/schedule_config_job/:userId([a-zA-Z0-9]{24})', async (req, res) => {
//   const userId = req.params.userId;
//   const token = res.locals.token;
//
//   // authorize if userId from JWT is the same as in userId param
//   if (!res.locals.userIdFromToken || !userId || !token) {
//     return res.sendStatus(400);
//   }
//
//   if (res.locals.userIdFromToken !== userId) {
//     return res.sendStatus(401);
//   }
//
//   const user = await databaseService.getUserById(userId);
//
//   if (!user) {
//     return res.sendStatus(404);
//   }
//
//   try {
//     const response = await superagent
//       .post(`${Constants.t2tCoreUrl}schedule_config_job/${user._id}`)
//       .send({})
//       .on('error', (err) => {
//         let statusCode = 503;
//         if (err && err.status) {
//           statusCode = err.status
//         }
//
//         return res.status(statusCode).send({ scheduled: false });
//       });
//
//     if (response.ok) {
//       // + change status => 'active'
//       console.log('Config job scheduled');
//       return res.send({ scheduled: true });
//     }
//   } catch (ex) {
//     // t2t core api errors already handled in .on callback above
//     // this handles only edge cases => should not happen
//   }
// });
//
// router.post('/schedule_time_entries_job/:userId([a-zA-Z0-9]{24})', async (req, res) => {
//   const userId = req.params.userId;
//   const token = res.locals.token;
//
//   // authorize if userId from JWT is the same as in userId param
//   if (!res.locals.userIdFromToken || !userId || !token) {
//     return res.sendStatus(400);
//   }
//
//   if (res.locals.userIdFromToken !== userId) {
//     return res.sendStatus(401);
//   }
//
//   const user = await databaseService.getUserById(userId);
//
//   if (!user) {
//     return res.sendStatus(404);
//   }
//
//   try {
//     const response = await superagent
//       .post(`${Constants.t2tCoreUrl}schedule_time_entries_job/${user._id}`)
//       .send({})
//       .on('error', (err) => {
//         let statusCode = 503;
//         if (err && err.status) {
//           statusCode = err.status
//         }
//
//         return res.status(statusCode).send({ scheduled: false });
//       });
//
//     if (response.ok) {
//       // + change status => 'active'
//       console.log('Time entries job scheduled');
//       return res.send({ scheduled: true });
//     }
//   } catch (ex) {
//     // t2t core api errors already handled in .on callback above
//     // this handles only edge cases => should not happen
//   }
// });
//
// router.post('/start/:userId([a-zA-Z0-9]{24})', async (req, res) => {
//   const userId = req.params.userId;
//   const token = res.locals.token;
//
//   // authorize if userId from JWT is the same as in userId param
//   if (!res.locals.userIdFromToken || !userId || !token) {
//     return res.sendStatus(400);
//   }
//
//   if (res.locals.userIdFromToken !== userId) {
//     return res.sendStatus(401);
//   }
//
//   const user = await databaseService.getUserById(userId);
//
//   if (!user) {
//     return res.sendStatus(404);
//   }
//
//   // set status to active now
//   user.status = 'active';
//   await databaseService.updateUser(user);
//
//   try {
//     const response = await superagent
//       .post(`${Constants.t2tCoreUrl}start/${user._id}`)
//       .send({})
//       .on('error', (err) => {
//         let statusCode = 503;
//         if (err && err.status) {
//           statusCode = err.status
//         }
//
//         // in case of error, set back status to inactive
//         user.status = 'inactive';
//         databaseService.updateUser(user);
//
//         return res.status(statusCode).send({ started: false });
//       });
//
//     if (response.ok) {
//       // + change status => 'active'
//       console.log('Jobs started, setting status => active');
//       user.status = 'active';
//       databaseService.updateUser(user);
//       return res.send({ started: true });
//     }
//   } catch (ex) {
//     // t2t core api errors already handled in .on callback above
//     // this handles only edge cases => should not happen
//   }
// });
//
// router.post('/stop/:userId([a-zA-Z0-9]{24})', async (req, res) => {
//   const userId = req.params.userId;
//   const token = res.locals.token;
//
//   // authorize if userId from JWT is the same as in userId param
//   if (!res.locals.userIdFromToken || !userId || !token) {
//     return res.sendStatus(400);
//   }
//
//   if (res.locals.userIdFromToken !== userId) {
//     return res.sendStatus(401);
//   }
//
//   const user = await databaseService.getUserById(userId);
//
//   if (!user) {
//     return res.sendStatus(404);
//   }
//
//   try {
//     const response = await superagent
//       .post(`${Constants.t2tCoreUrl}stop/${user._id}`)
//       .send({})
//       .on('error', (err) => {
//         let statusCode = 503;
//         if (err && err.status) {
//           statusCode = err.status
//         }
//
//         return res.status(statusCode).send({ stopped: false });
//       });
//
//     if (response.ok) {
//       // + change status => 'inactive'
//       console.log('Jobs stopped, setting status => inactive');
//       user.status = 'inactive';
//       databaseService.updateUser(user);
//       return res.send({ stopped: true });
//     }
//   } catch (ex) {
//     // t2t core api errors already handled in .on callback above
//   }
// });
//
// router.post('/scheduled/:userId([a-zA-Z0-9]{24})', async (req, res) => {
//   const userId = req.params.userId;
//   const token = res.locals.token;
//
//   // authorize if userId from JWT is the same as in userId param
//   if (!res.locals.userIdFromToken || !userId || !token) {
//     return res.sendStatus(400);
//   }
//
//   if (res.locals.userIdFromToken !== userId) {
//     return res.sendStatus(401);
//   }
//
//   const user = await databaseService.getUserById(userId);
//
//   if (!user) {
//     return res.sendStatus(404);
//   }
//
//   try {
//     const response = await superagent
//       .post(`${Constants.t2tCoreUrl}scheduled/${user._id}`)
//       .send({})
//       .on('error', (err) => {
//         let statusCode = 503;
//         if (err && err.status) {
//           statusCode = err.status
//         }
//
//         return res.status(statusCode).send({ scheduled: false });
//       });
//
//
//     if (response.ok && response.body.scheduled === true) {
//       return res.send({ scheduled: true });
//     } else if (response.ok && response.body.scheduled === false) {
//       return res.send({ scheduled: false });
//     }
//   } catch (ex) {
//     // t2t core api errors already handled in .on callback above
//   }
// });
//
// module.exports = router;