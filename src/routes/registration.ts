import express from 'express';
import bcrypt from 'bcrypt';
import { isEmail, validate } from 'class-validator';
import { databaseService } from '../shared/database_service';
import { Constants } from '../shared/constants';
import { UserRegistration } from '../models/user_registration';
import { sendEmail } from '../shared/email_service';
import { translateService } from '../shared/translate_service';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

/**
 * Sends email with unique link to complete the registration.
 * Does not create a new user object, it gets done only when registration is completed.
 * 
 * In req.body, there should be object { username }.
 */
router.post('/', async (req, res) => {
  const username = req.body['username'];

  if (!username || !isEmail(username)) {
    return res.sendStatus(400);
  }

  // firstly check if there is not already user with same username
  const userFromDB = await databaseService.getUserByUsername(username);

  if (userFromDB) {
    return res.sendStatus(409);
  }

  const ttlToken = await databaseService.createTtlTokenTwoDaysForUsername(username);
  if (!ttlToken) {
    return res.sendStatus(503);
  }

  const language = 'en';
  sendEmail(
    username,
    language,
    translateService.get(language, 'emailRegistrationSubject'),
    translateService.get(language, 'emailRegistrationBody')
      .replace(/{{ token }}/g, ttlToken.token),
  );

  return res.sendStatus(204);
});

/**
 * Creates user with status === 'registrated'.
 * In req.body, there should be object { password, passwordAgain }.
 * Also, unique token should be in the request.
 */
router.post('/:token([a-zA-Z0-9]{24})', async (req, res) => {
  const token = req.params?.token;
  if (!req.body['password']
    || !req.body['passwordAgain']
    || !token) {
    return res.sendStatus(400);
  }

  // do not need to validate token's expiration time, because it is db ttl object and expired ones will be deleted automatically
  // so simply finding token in DB means it is valid
  const ttlToken = await databaseService.getTtlTokenTwoDays(token);
  if (!ttlToken) {
    return res.sendStatus(404);
  }

  const user = new UserRegistration(
    ttlToken.username,
    req.body['password'],
    req.body['passwordAgain'],
  );

  const validationResults = await validate(user);

  if (validationResults.length !== 0 || user.password !== user.passwordAgain) {
    return res.sendStatus(400);
  }

  // firstly check if there is not already user with same username
  const userFromDB = await databaseService.getUserByUsername(user.username);

  if (userFromDB) {
    return res.sendStatus(409);
  }

  try {
    // generate password hash
    const hash = await bcrypt.hash(user.password, Constants.bcryptSaltRounds);

    // store in DB
    await databaseService.createUser(user.username, hash);

    return res.sendStatus(204);
  } catch (ex) {
    console.log(ex);
    return res.sendStatus(503);
  }
});

module.exports = router;