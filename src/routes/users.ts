import express from 'express';
import { databaseService } from '../shared/database_service';
import { UserToClient } from '../models/user_to_client';
import { Constants } from '../shared/constants';
import { auth } from 'express-oauth2-jwt-bearer';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
  audience: Constants.authAudience,
  issuerBaseURL: Constants.authDomain,
});

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Users router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');

  next();
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
