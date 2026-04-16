export type PartnerRequestPayload = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  orgType: string;
  message?: string;
};

export type PartnerRequest = PartnerRequestPayload & {
  id: string;
  createdAt: string;
};
