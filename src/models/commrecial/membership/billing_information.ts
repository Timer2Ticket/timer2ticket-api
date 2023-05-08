export class BillingInformation {
  name!: string;
  vatId!: string;
  street!: string;
  zipCode!: string;
  city!: string;
  country!: string;


  static default(): BillingInformation {
    const billingInformation = new BillingInformation();
    billingInformation.name = '';
    billingInformation.vatId = '';
    billingInformation.street = '';
    billingInformation.zipCode = '';
    billingInformation.city = '';
    billingInformation.country = '';
    return billingInformation;
  }
}