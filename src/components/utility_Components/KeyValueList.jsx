import { useContext } from "react";
import { PlusSquare, Trash2, Copy, FileCode, FileText } from "lucide-react";
import { ContextMenuContext } from "../../context/ContextMenuContext";

export default function KeyValueList ({items=[],onChange, editable = true, showAddBtn = true, label = "Key & Value", addLable = "Add", emptyMessage="No items available" })
{
    const { openContextMenu, copyToClipboard } = useContext(ContextMenuContext);

    const addItem = () => {
        if (!onChange) return;
        onChange([
            ...items,
            {
                key:"",
                value:""
            }
        ]);
    };

    const insertItemBelow = (index) => {
        if (!onChange) return;
        const next = [...items];
        next.splice(index + 1, 0, { key: "", value: "" });
        onChange(next);
    };

    const duplicateItem = (index) => {
        if (!onChange) return;
        const target = items[index];
        const next = [...items];
        next.splice(index + 1, 0, { key: target?.key ?? "", value: target?.value ?? "" });
        onChange(next);
    };

    const updateItem = (index,field,value)=>{
        if (!onChange) return;
        const updated = items.map((item,i)=>
            i===index ? {...item, [field]:value}:item
        );
        onChange(updated);
    };

    const removeItem = (index) => {
        if (!onChange) return;
        onChange(items.filter((_,i)=>i!==index));
    };

    const clearAllItems = () => {
        if (!onChange) return;
        onChange([]);
    };

    const copyAllAsJSON = () => {
        const jsonObject = items.reduce((acc, curr) => {
            const k = (curr.key || '').trim();
            if (k) acc[k] = curr.value || '';
            return acc;
        }, {});
        copyToClipboard(JSON.stringify(jsonObject, null, 2), `Copied all ${label.toLowerCase()} as JSON!`);
    };

    const copyAllAsText = () => {
        const text = items
            .filter(it => it.key || it.value)
            .map(it => `${it.key}: ${it.value}`)
            .join('\n');
        copyToClipboard(text || "No items", `Copied all ${label.toLowerCase()}!`);
    };

    const handleRowContextMenu = (e, item, index) => {
        e.preventDefault();
        e.stopPropagation();

        if (editable) {
            const menuItems = [
                { 
                    type: "header", 
                    label: item.key ? `${label} • ${item.key}` : `${label} Row` 
                },
                {
                    label: "Duplicate Row",
                    icon: Copy,
                    onClick: () => duplicateItem(index)
                },
                {
                    label: "Insert Row Below",
                    icon: PlusSquare,
                    onClick: () => insertItemBelow(index)
                },
                { type: "separator" },
                {
                    label: 'Copy "Key: Value"',
                    icon: Copy,
                    disabled: !item.key && !item.value,
                    onClick: () => copyToClipboard(`${item.key}: ${item.value}`, `Copied ${label} row!`)
                },
                {
                    label: "Copy Key",
                    disabled: !item.key,
                    onClick: () => copyToClipboard(item.key, `Copied key "${item.key}"!`)
                },
                {
                    label: "Copy Value",
                    disabled: !item.value,
                    onClick: () => copyToClipboard(item.value, "Copied value!")
                },
                { type: "separator" },
                {
                    label: "Copy All as JSON",
                    icon: FileCode,
                    disabled: items.length === 0,
                    onClick: () => copyAllAsJSON()
                },
                { type: "separator" },
                {
                    label: "Delete Row",
                    icon: Trash2,
                    danger: true,
                    onClick: () => removeItem(index)
                },
                {
                    label: `Clear All ${label}`,
                    icon: Trash2,
                    danger: true,
                    disabled: items.length === 0,
                    onClick: () => clearAllItems()
                }
            ];
            openContextMenu(e, menuItems);
        } else {
            const menuItems = [
                { 
                    type: "header", 
                    label: item.key ? `${label} • ${item.key}` : `${label} Row` 
                },
                {
                    label: 'Copy "Key: Value"',
                    icon: Copy,
                    onClick: () => copyToClipboard(`${item.key}: ${item.value}`, `Copied ${label} row!`)
                },
                {
                    label: "Copy Key",
                    onClick: () => copyToClipboard(item.key, `Copied key "${item.key}"!`)
                },
                {
                    label: "Copy Value",
                    onClick: () => copyToClipboard(item.value, "Copied value!")
                },
                { type: "separator" },
                {
                    label: "Copy All as JSON",
                    icon: FileCode,
                    onClick: () => copyAllAsJSON()
                },
                {
                    label: "Copy All as Text",
                    icon: FileText,
                    onClick: () => copyAllAsText()
                }
            ];
            openContextMenu(e, menuItems);
        }
    };

    const handleContainerContextMenu = (e) => {
        if (e.target.closest('.kv-row')) return;
        e.preventDefault();

        if (editable) {
            const menuItems = [
                { type: "header", label: `${label} Actions` },
                ...(showAddBtn ? [
                    {
                        label: addLable || "Add Row",
                        icon: PlusSquare,
                        onClick: addItem
                    }
                ] : []),
                {
                    label: "Copy All as JSON",
                    icon: FileCode,
                    disabled: items.length === 0,
                    onClick: copyAllAsJSON
                },
                ...(items.length > 0 ? [
                    { type: "separator" },
                    {
                        label: `Clear All ${label}`,
                        icon: Trash2,
                        danger: true,
                        onClick: clearAllItems
                    }
                ] : [])
            ];
            openContextMenu(e, menuItems);
        } else {
            const menuItems = [
                { type: "header", label: `${label}` },
                {
                    label: "Copy All as JSON",
                    icon: FileCode,
                    disabled: items.length === 0,
                    onClick: copyAllAsJSON
                },
                {
                    label: "Copy All as Text",
                    icon: FileText,
                    disabled: items.length === 0,
                    onClick: copyAllAsText
                }
            ];
            openContextMenu(e, menuItems);
        }
    };

  return (
    <div className="kv-container" onContextMenu={handleContainerContextMenu}>
      {editable && showAddBtn &&
        <div className="pane-header">
            <span className="label">{label}</span>
            <button className="add-row-btn" onClick={addItem}><PlusSquare size={15}/>{addLable}</button>
        </div>
      }

      <div className="kv-table">
        {items.length>0 ? (
            items.map((item, index) => (
                <div 
                  className="kv-row" 
                  key={index}
                  onContextMenu={(e) => handleRowContextMenu(e, item, index)}
                >
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
                        <div className="kv-read-cell">
                          <span className="header-key" title={item.key}>{item.key}</span>
                          <button className="kv-copy-icon" onClick={() => copyToClipboard(item.key, `Copied key "${item.key}"!`)} title="Copy Key"><Copy size={10}/></button>
                        </div>
                        <div className="kv-read-cell">
                          <span className="header-val" title={item.value}>{item.value}</span>
                          <button className="kv-copy-icon" onClick={() => copyToClipboard(item.value, "Copied value!")} title="Copy Value"><Copy size={10}/></button>
                        </div>
                        <div className="kv-read-action">
                          <button className="kv-copy-icon" onClick={() => copyToClipboard(`${item.key}: ${item.value}`, `Copied ${item.key}!`)} title="Copy Both"><Copy size={14}/></button>
                        </div>
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