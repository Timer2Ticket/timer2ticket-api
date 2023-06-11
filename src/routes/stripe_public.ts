import express from 'express';
import { Constants } from '../shared/constants';

const router = express.Router({ mergeParams: true });
router.use(express.urlencoded({ extended: false }));
router.use(express.json());


// middleware that is specific to this router
router.use((req, res, next) => {
  console.log(`Stripe public router calls at time: ${Date.now()}`);

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

// router.get('/memberships', async (req, res) => {
//   const memberships = await stripeCommons.getAllProducts();
//
//   if(!memberships) {
//     return res.sendStatus(500);
//   }
//
//   return res.send(memberships);
// });

// TODO webhooks

module.exports = router;
