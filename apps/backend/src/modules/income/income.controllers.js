import * as incomeService from './income.services.js';
import * as incomeRepository from './income.repository.js';
import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from '../../utils/authorization.js';

// Create new income
export const createIncome = async (req, res, next) => {
    try {
        const incomeData = await incomeService.prepareIncomeData({ ...req.body, user: req.user._id });
        const income = await incomeRepository.create(incomeData);
        res.status(201).json({ success: true, message: "Income created successfully", data: income });
    } catch (err) {
        next(err);
    }
};

// Get all incomes with filters
export const getIncomes = async (req, res, next) => {
    try {
        const targetUserId = req.query.userId || req.user._id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        assertSameUserOrAdmin(targetUserId, requester, 'access these incomes');

        const query = { user: targetUserId };

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.month && req.query.year) {
            const month = parseInt(req.query.month, 10);
            const year = parseInt(req.query.year, 10);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            query.date = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const incomes = await incomeRepository.find(query);
        res.json({ success: true, data: incomes });
    } catch (err) {
        next(err);
    }
};

// Get income by ID
export const getIncomeById = async (req, res, next) => {
    try {
        const incomeId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const income = await incomeRepository.findById(incomeId);
        if (!income) {
            throw buildError('Income not found', 404);
        }

        assertOwnerOrAdmin(income.user, requester, 'view this income');

        res.json({ success: true, data: income });
    } catch (err) {
        next(err);
    }
};

// Update income
export const updateIncome = async (req, res, next) => {
    try {
        const incomeId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingIncome = await incomeRepository.findById(incomeId);
        if (!existingIncome) {
            throw buildError('Income not found', 404);
        }

        assertOwnerOrAdmin(existingIncome.user, requester, 'update this income');

        const updates = await incomeService.prepareIncomeData(req.body);
        const updatedIncome = await incomeRepository.update(incomeId, updates);

        res.json({ success: true, message: "Income updated successfully", data: updatedIncome });
    } catch (err) {
        next(err);
    }
};

// Delete income
export const deleteIncome = async (req, res, next) => {
    try {
        const incomeId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingIncome = await incomeRepository.findById(incomeId);
        if (!existingIncome) {
            throw buildError('Income not found', 404);
        }

        assertOwnerOrAdmin(existingIncome.user, requester, 'delete this income');
        await incomeRepository.deleteById(incomeId);

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

// Get income summary
export const getIncomeSummary = async (req, res, next) => {
    try {
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        const targetUserId = req.query.userId || req.user._id;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access these stats');

        const pipeline = incomeService.buildMonthlyStatsPipeline(targetUserId, month, year);
        const stats = await incomeRepository.aggregate(pipeline);

        const totalIncome = stats.reduce((sum, item) => sum + item.totalAmount, 0);

        res.json({
            success: true,
            data: {
                totalIncome,
                categoryBreakdown: stats.map(item => ({
                    category: item._id,
                    total: item.totalAmount,
                    count: item.count
                }))
            }
        });
    } catch (err) {
        next(err);
    }
};
