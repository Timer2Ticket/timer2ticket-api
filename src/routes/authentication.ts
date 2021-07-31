import express from 'express';
import bcrypt from 'bcrypt';
import { databaseService } from '../shared/database_service';
import jwt from 'jsonwebtoken';
import { validate } from 'class-validator';
import { UserAuthentication } from '../models/user_authentication';
import { UserToClient } from '../models/user_to_client';
import { Constants } from '../shared/constants';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

/**
 * Authenticate user + send him JWT
 * In req.body, there should be object { username, password }.
 */
router.post('/', async (req, res) => {
  if (!req.body['username']
    || !req.body['password']) {
    return res.sendStatus(400);
  }

  const user = new UserAuthentication(
    req.body['username'],
    req.body['password'],
  );

  const validationResults = await validate(user);

  if (validationResults.length !== 0) {
    return res.sendStatus(400);
  }

  const userFromDB = await databaseService.getUserByUsername(user.username);

  if (!userFromDB) {
    return res.sendStatus(404);
  }

  try {
    // Compare password
    const isValid = await bcrypt.compare(user.password, userFromDB.passwordHash);

    if (!isValid) {
      return res.sendStatus(401);
    }

    const token = jwt.sign(
      {
        id: userFromDB._id,
      },
      Constants.jwtSecret,
      {
        expiresIn: 21600, // 6 hours
      });

    return res.send(new UserToClient(userFromDB, token));
  } catch (error) {
    console.log(error);
    return res.sendStatus(503);
  }
});

module.exports = router;