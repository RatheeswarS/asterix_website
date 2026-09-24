import mongoose from 'mongoose';

/**
 * Atomic named sequences (e.g. workshop receipt numbers). `$inc` inside a
 * single findOneAndUpdate is atomic, so concurrent callers never get the same
 * value.
 */
const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

export async function nextSequence(name) {
    const doc = await Counter.findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return doc.seq;
}

export default Counter;
