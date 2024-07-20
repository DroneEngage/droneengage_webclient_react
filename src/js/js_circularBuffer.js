/* ********************************************************************************
*   Mohammad Hefny
*
*   26 Apr 2017
*
*********************************************************************************** */


export class ClssCustomCircularBuffer 
{

    constructor (p_length)
    {
        this.m_buffer = new Array(p_length);
        this.m_head = 0;
        this.m_tail = 0;
        this.m_unitCount =0;
    }

    fn_add (p_toAdd, p_forgetOld,fn_onDeleteCallBack) 
    {
            if ((p_forgetOld === true) || (this.m_unitCount < this.m_buffer.length))
            {
                 if (this.m_buffer[this.m_head] !== null && this.m_buffer[this.m_head] !== undefined)
                 {
                    fn_onDeleteCallBack (this.m_buffer[this.m_head]);
                 }

                 delete this.m_buffer[this.m_head];
                 this.m_buffer[this.m_head] = p_toAdd;
                 this.m_head +=1;
                 this.m_unitCount = (this.m_unitCount + 1) % this.m_buffer.length;
            }
            else
            {
                // invalid call
                throw Error("Buffer Overflow");
                
            }
            this.m_head = this.m_head % this.m_buffer.length;
    }

    fn_get (p_ignoreUnderFlow)
    {
        var t = null;
        if (this.m_unitCount === 0) return null;
        if (this.m_unitCount < this.m_buffer.length)
        {
            t = this.m_buffer[this.m_tail];
            this.m_tail +=1;
            this.m_tail = this.m_tail % this.m_buffer.length;
            this.m_unitCount = this.m_unitCount -1;
        }
        else
        {
             if (p_ignoreUnderFlow === false) {
                throw Error("Buffer Underflow");
               
            }
        }

        return t;
    }

    fn_flush  ()
    {
        this.m_head = 0;
        this.m_tail = 0;
        this.m_unitCount =0;
    }

    toString  ()
    {
         return "ClssCustomCircularBuffer(size=" + this.m_buffer.length + ", head=" + this.m_head + ", tail=" + this.m_tail + ")";
    }


    fn_bufferFull  ()
    {
        return  (this.m_unitCount >= this.m_buffer.length);
    }
}

