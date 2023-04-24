import express from 'express';
import { databaseService } from '../shared/database_service';
import { UserToClient } from '../models/user_to_client';
import { Constants } from '../shared/constants';
import { UserChangePassword } from '../models/user_change_password';
import { Utilities } from '../shared/utilities';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Time: ${Date.now()}`);

  // verify JWT

  const tokenFromHeader = req.headers['x-access-token'];

  if (!tokenFromHeader) {
    return res.sendStatus(403);
  }

  const token = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(token, Constants.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      return res.sendStatus(401);
    }
    res.locals.userIdFromToken = decoded.id;
    res.locals.token = token;
    next();
  });
});

/**
 * Get user with userId in parameter - needs to be 24 length string (MongoDB ObjectId)
 */
router.get('/:userId([a-zA-Z0-9]{24})', async (req, res) => {
  const userId = req.params.userId;
  const token = res.locals.token;

  // authorize if userId from JWT is the same as in userId param
  if (!res.locals.userIdFromToken || !userId || !token) {
    return res.sendStatus(400);
  }

  if (res.locals.userIdFromToken !== userId) {
    return res.sendStatus(401);
  }

  const user = await databaseService.getUserById(userId);

  if (!user) {
    return res.sendStatus(404);
  }

  return res.send(new UserToClient(user, token));
});

module.exports = router;
