import dynoHandler from '../../server/routes/dynoHandler';

export default async function handler(req: any, res: any) {
  return dynoHandler(req, res);
}
