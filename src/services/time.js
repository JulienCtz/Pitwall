import ms from 'ms';

export const getExpiryDate = (durationStr) => {
  return new Date(Date.now() + ms(durationStr));
};
