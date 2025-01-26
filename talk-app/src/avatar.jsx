{modifiedArr.map(userId=>(
    <div onClick={()=>(setsSelectedUsername(userId))} className={"flex items-center gap-2 p-4 rounded-md text-xl font-black"+(userId==selectedUsername ? ' bg-black text-white':'')}>
    <div className= "bg-black rounded-full w-7 h-7"></div>
    {activePeople[userId]}
</div>)}

allUsers.map()