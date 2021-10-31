import express from 'express';
import bcrypt from 'bcrypt';
import { databaseService } from '../shared/database_service';
import jwt from 'jsonwebtoken';
import { validate } from 'class-validator';
import { UserAuthentication } from '../models/user_authentication';
import { UserToClient } from '../models/user_to_client';
import { Constants } from '../shared/constants';
import { sendEmail } from '../shared/email_service';
import { translateService } from '../shared/translate_service';
import { UserResetPassword } from '../models/user_reset_password';

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

/**
 * Generate reset ttl token for given username (email) user.
 * The token can be used to reset password.
 */
router.post('/reset', async (req, res) => {
  const username = req.body['username'];
  if (!username) {
    return res.sendStatus(400);
  }

  const user = await databaseService.getUserByUsername(username);
  if (!user) {
    return res.sendStatus(404);
  }

  const ttlToken = await databaseService.createTtlTokenOneHourForUsername(username);
  if (!ttlToken) {
    return res.sendStatus(503);
  }

  const language = 'en';
  sendEmail(
    username,
    language,
    translateService.get(language, 'emailPasswordResetRequestSubject'),
    translateService.get(language, 'emailPasswordResetRequestBody')
      .replace(/{{ token }}/g, ttlToken.token),
  );

  return res.sendStatus(204);
});

/**
 * Reset user's password. The token needs to be in the params.
 */
router.post('/reset/:token([a-zA-Z0-9]{24})', async (req, res) => {
  const token = req.params?.token;
  const newPassword = req.body['newPassword'];
  const newPasswordAgain = req.body['newPasswordAgain'];
  if (!token || !newPassword || !newPasswordAgain) {
    return res.sendStatus(400);
  }

  const userResetPassword = new UserResetPassword(
    newPassword,
    newPasswordAgain,
  );

  const validationResults = await validate(userResetPassword);

  if (validationResults.length !== 0 || userResetPassword.newPassword !== userResetPassword.newPasswordAgain) {
    return res.sendStatus(400);
  }

  // do not need to validate token's expiration time, because it is db ttl object and expired ones will be deleted automatically
  // so simply finding token in DB means it is valid
  const ttlToken = await databaseService.getTtlTokenOneHour(token);
  if (!ttlToken) {
    return res.sendStatus(404);
  }

  const user = await databaseService.getUserByUsername(ttlToken.username);
  if (!user) {
    return res.sendStatus(404);
  }

  try {
    // generate new password hash
    const newHash = await bcrypt.hash(userResetPassword.newPassword, Constants.bcryptSaltRounds);
    user.passwordHash = newHash;
    const updatedUser = await databaseService.updateUser(user);

    if (!updatedUser) {
      return res.sendStatus(503);
    }

    const language = 'en';
    sendEmail(
      user.username,
      language,
      translateService.get(language, 'emailPasswordResetDoneSubject'),
      translateService.get(language, 'emailPasswordResetDoneBody'),
    );

    // do not await (it is not important to delete it because it is db's ttl object)
    databaseService.deleteTtlTokenOneHour(ttlToken._id);

    return res.sendStatus(204);
  } catch (error) {
    return res.sendStatus(503);
  }
});

module.exports = router;