import { Request, Response } from 'express';
import Department from '../models/department.model';

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ title: 1 });
    res.json(departments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllDepartmentsAdmin = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find().sort({ title: 1 });
    res.json(departments);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const existingDepartment = await Department.findOne({ title: { $regex: new RegExp(`^${title}$`, 'i') } });
    if (existingDepartment) {
      return res.status(409).json({ message: 'Department with this title already exists' });
    }

    const department = await Department.create({ title, description });
    res.status(201).json(department);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { title, description, isActive } = req.body;
    
    // Check if title already exists (excluding current department)
    if (title) {
      const existingDepartment = await Department.findOne({ 
        title: { $regex: new RegExp(`^${title}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingDepartment) {
        return res.status(409).json({ message: 'Department with this title already exists' });
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { title, description, isActive },
      { new: true }
    );
    
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleDepartmentStatus = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    
    department.isActive = !department.isActive;
    await department.save();
    
    res.json(department);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};