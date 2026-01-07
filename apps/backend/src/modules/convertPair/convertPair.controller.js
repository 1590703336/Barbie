import * as convertPairRepository from './convertPair.repository.js';
import { assertOwnerOrAdmin, buildError } from '../../utils/authorization.js';

// Create new convert pair
export const createConvertPair = async (req, res, next) => {
    try {
        const data = {
            ...req.body,
            user: req.user._id
        };
        const pair = await convertPairRepository.create(data);
        res.status(201).json({
            success: true,
            message: 'Convert pair created successfully',
            data: pair
        });
    } catch (err) {
        next(err);
    }
};

// Get all convert pairs for current user
export const getConvertPairs = async (req, res, next) => {
    try {
        const pairs = await convertPairRepository.findByUser(req.user._id);
        res.json({
            success: true,
            data: pairs
        });
    } catch (err) {
        next(err);
    }
};

// Update convert pair
export const updateConvertPair = async (req, res, next) => {
    try {
        const pairId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingPair = await convertPairRepository.findById(pairId);
        if (!existingPair) {
            throw buildError('Convert pair not found', 404);
        }

        assertOwnerOrAdmin(existingPair.user, requester, 'update this convert pair');

        const updatedPair = await convertPairRepository.update(pairId, req.body);
        res.json({
            success: true,
            message: 'Convert pair updated successfully',
            data: updatedPair
        });
    } catch (err) {
        next(err);
    }
};

// Delete convert pair
export const deleteConvertPair = async (req, res, next) => {
    try {
        const pairId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingPair = await convertPairRepository.findById(pairId);
        if (!existingPair) {
            throw buildError('Convert pair not found', 404);
        }

        assertOwnerOrAdmin(existingPair.user, requester, 'delete this convert pair');
        await convertPairRepository.deleteById(pairId);

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
