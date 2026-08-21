import { PlusSquare, Trash2 } from "lucide-react";

export default function KeyValueList ({items=[],onChange, editable = true, showAddBtn = true, label = "Key & Value", addLable = "Add", emptyMessage="No items available" })
{
    const addItem = ()=>{
        onChange([
            ...items,
            {
                key:"",
                value:"",
                active:true
            }
        ])
    };

    const updateItem = (index,field,value)=>{
        const updated = items.map((item,i)=>
            i===index ? {...item, [field]:value}:item
        )
        onChange(updated)
    }

    const removeItem = (index) => {
        onChange(items.filter((_,i)=>i!==index))
    }
  return (
    <div className="kv-container">
      {editable && showAddBtn &&
        <div className="pane-header">
            <span className="label">{label}</span>
            <button className="add-row-btn" onClick={addItem}><PlusSquare size={15}/>{addLable}</button>
        </div>
      }

      <div className="kv-table">
        {items.length>0 ? (
            items.map((item, index) => (
                <div className="kv-row" key={index}>
                  {editable ? 
                      (<>
                          <input 
                          type="text" 
                          placeholder="Key" 
                          value={item.key} 
                          onChange={(e) => updateItem(index, 'key', e.target.value)}
                          />
                          <input 
                          type="text" 
                          placeholder="Value" 
                          value={item.value} 
                          onChange={(e) => updateItem(index, 'value', e.target.value)}
                          />
                          <button className="remove-row" onClick={() => removeItem(index)}><Trash2 size={15}/></button>
                      </>) : (
                        <>
                        <span className="header-key">{item.key}</span>
                        <span className="header-val">{item.value}</span>
                        </>
                      )
                  }
                </div>
            )) 
           ) : (
               <div className="empty-state">{emptyMessage}</div>
           )
        }
      </div>
    </div>
  );
}