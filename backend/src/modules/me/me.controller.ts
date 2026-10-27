import type { Request, Response } from 'express';
import type { UpdateMeInput } from './me.schemas';
import { getMe, updateMe } from './me.service';

export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const result = await getMe(req.userId as string);
  res.status(200).json(result);
}

export async function updateMeHandler(req: Request, res: Response): Promise<void> {
  const result = await updateMe(req.userId as string, req.body as UpdateMeInput);
  res.status(200).json(result);
}
