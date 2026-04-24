import { Request, Response } from 'express';
import BloodBank from '../models/blood_bank.model';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { division, district, upazila, bloodGroup } = req.query;
    const filter: any = {};
    if (division) filter.division = division;
    if (district) filter.district = district;
    if (upazila) filter.upazila = upazila;
    if (bloodGroup) filter.availableGroups = bloodGroup;
    const banks = await BloodBank.find(filter).populate('hospitalId', 'name').sort({ createdAt: -1 });
    res.json(banks);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const bank = await BloodBank.create(req.body);
    res.status(201).json(bank);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const update = async (req: Request, res: Response) => {
  try {
    const bank = await BloodBank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bank) return res.status(404).json({ message: 'Not found' });
    res.json(bank);
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await BloodBank.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err: any) { res.status(500).json({ message: err.message }); }
};
