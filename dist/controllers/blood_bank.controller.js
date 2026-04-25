"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.getAll = void 0;
const blood_bank_model_1 = __importDefault(require("../models/blood_bank.model"));
const getAll = async (req, res) => {
    try {
        const { division, district, upazila, bloodGroup } = req.query;
        const filter = {};
        if (division)
            filter.division = division;
        if (district)
            filter.district = district;
        if (upazila)
            filter.upazila = upazila;
        if (bloodGroup)
            filter.availableGroups = bloodGroup;
        const banks = await blood_bank_model_1.default.find(filter).populate('hospitalId', 'name').sort({ createdAt: -1 });
        res.json(banks);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getAll = getAll;
const create = async (req, res) => {
    try {
        const bank = await blood_bank_model_1.default.create(req.body);
        res.status(201).json(bank);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.create = create;
const update = async (req, res) => {
    try {
        const bank = await blood_bank_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bank)
            return res.status(404).json({ message: 'Not found' });
        res.json(bank);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.update = update;
const remove = async (req, res) => {
    try {
        await blood_bank_model_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.remove = remove;
