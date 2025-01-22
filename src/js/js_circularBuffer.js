/* ********************************************************************************
*   Mohammad Hefny
*
*   26 Apr 2017
*
*********************************************************************************** */


export class ClssCustomCircularBuffer 
{

    constructor(p_length) {
        if (!Number.isInteger(p_length) || p_length <= 0) {
            throw new Error("Buffer length must be a positive integer.");
        }
        this.m_buffer = new Array(p_length);
        this.m_head = 0;
        this.m_tail = 0;
        this.m_unitCount = 0;
    }

    fn_add(p_toAdd, p_forgetOld, fn_onDeleteCallBack) {
        if (this.fn_bufferFull() && !p_forgetOld) {
            throw new Error("Buffer Overflow");
        }
    
        if (this.fn_bufferFull() && fn_onDeleteCallBack) {
            fn_onDeleteCallBack(this.m_buffer[this.m_head]);
        }
    
        this.m_buffer[this.m_head] = p_toAdd;
        this.m_head = (this.m_head + 1) % this.m_buffer.length;
    
        if (this.m_unitCount < this.m_buffer.length) {
            this.m_unitCount++;
        }
    }

    fn_get(p_ignoreUnderFlow = false) {
        if (this.m_unitCount === 0) {
            if (!p_ignoreUnderFlow) {
                throw new Error("Buffer Underflow");
            }
            return null;
        }
    
        const item = this.m_buffer[this.m_tail];
        this.m_tail = (this.m_tail + 1) % this.m_buffer.length;
        this.m_unitCount--;
        return item;
    }

    fn_flush() {
        this.m_buffer.fill(null); // Clear the buffer to avoid memory leaks
        this.m_head = 0;
        this.m_tail = 0;
        this.m_unitCount = 0;
    }

    toString() 
    {
        return `ClssCustomCircularBuffer(size=${this.m_buffer.length}, head=${this.m_head}, tail=${this.m_tail}, count=${this.m_unitCount})`;
    }


    fn_bufferFull() 
    {
        return this.m_unitCount >= this.m_buffer.length;
    }
}

