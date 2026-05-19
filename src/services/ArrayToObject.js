export function ArrayToObject(arr=[])
{
    arr.reduce((acc,item)=>{
        if(item.key) acc[item.key]=item.value
        return acc;
    },{});
}