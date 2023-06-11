import express from 'express';
import { Constants } from '../shared/constants';
import { authCommons } from '../shared/auth_commons';

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Stripe router calls at time: ${Date.now()}`);

  // For CORS policy
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,sentry-trace');

  if (!Constants.isCommercialVersion) {
    return res.sendStatus(403);
  } else {
    next();
  }
});

router.post('/membership', authCommons.checkJwt, async (req, res) => {
  if (!authCommons.authorizeUser(req)) {
    return res.sendStatus(401);
  }

  const auth0UserId = req.params.auth0UserId;

  // create stripe customer

  // create stripe subscription
  return res.sendStatus(200);
});

module.exports = router;
