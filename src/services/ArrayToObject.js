export function ArrayToObject(arr=[])
{
    arr.reduce((acc,item)=>{
        if(item.key) acc[key]=item.value
        return acc;
    },{});
}