import express from 'express';
import bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { databaseService } from '../shared/database_service';
import { Constants } from '../shared/constants';
import { UserRegistration } from '../models/user_registration';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

/**
 * Creates user with status === 'registrated'.
 * In req.body, there should be object { username, password, passwordAgain }.
 */
router.post('/', async (req, res) => {
  if (!req.body['username']
    || !req.body['password']
    || !req.body['passwordAgain']) {
    return res.sendStatus(400);
  }

  const user = new UserRegistration(
    req.body['username'],
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