import React from 'react';

import ResponsiveButton from './ResponsiveButton';
import ServedItem from './ServedItem';
import SummaryListItem from './SummaryListItem';
import QrComponent from './QrComponent';
import SimpleTextHeader from './SimpleTextHeader';

const icon_folder = require("../icons/icon_folder_4.png");

const Outbox = ({hostedFiles, setHostedFiles, handleAddText, addTextValue, setAddTextValue, setSelectedSFile, protocol, ip, port, activeSFile}) => {
    return (
        <div style={{display: "flex", flexDirection: "row", height: "100%", width: "100%"}}>
            <div id="left-summary-panel" onClick={()=>{setSelectedSFile(null);}} style={{display: "flex", flexDirection: "column", boxSizing: "content-box"}}>
                <div style={{display: "flex", flexDirection: "column", maxHeight: "100%"}}>
                    <div className="left-send-header" style={{ display: "flex", justifyItems: "space-between", flexDirection: "column", marginBottom: "4px"}}>
                        <h4 style={{marginBottom: "3px", marginTop: "5px", marginLeft: "12px"}}>Outbox</h4>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "space-between", height: "25px"}}>
                            <span className="simple-text" style={{margin: "auto", marginLeft: "13px", fontSize: "0.8rem", height: "fit-content"}}>{hostedFiles.length} item{hostedFiles.length !== 1 ? "s" : ""}</span>
                        </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "row", padding: "0px 0px 0px 0px", width: "94%", margin: "auto"}}>
                        <form onSubmit={(e) => {handleAddText(e, setHostedFiles, setSelectedSFile, addTextValue, setAddTextValue, protocol, ip, port);}} style={{display: "block", boxSizing: "border-box", width:"calc(100% - 30px)", height: "30px", marginRight: "4px"}}>
                            <input type="text" className="theme-text-input" onClick={(e)=>{e.stopPropagation();}} value={addTextValue} onChange={(e) => setAddTextValue(e.target.value)} id="addtext" name="addtext" placeholder="Add text here ..." style={{width: "100%", boxSizing: "border-box", borderRadius: "6px", backgroundColor: "#222222"}}/>
                        </form>
                        <ResponsiveButton 
                        label={<img src={icon_folder} style={{width: "16px"}} />}
                        buttonAction={() => outboxAPI.openFile(null)}
                        selected={false}
                        enabled={true}
                        customStyle={{width: "30px", height: "30px", borderRadius: "6px", justifyContent: "center", alignItems: "center"}}
                        shadeA={"#282828"}
                        shadeB={"#303030"}
                        shadeC={"#343434"}
                        />
                    </div>
                    <div style={{display: "flex", flexDirection: "column", flexShrink: "1", gap: "4px", height: "fit-content", marginLeft: "0", marginRight: "0", marginTop: "4px", overflowY: "auto"}}>
                    {hostedFiles != null ? hostedFiles.map((file, i) => (
                        <ResponsiveButton
                        key={file.id}
                        label={<SummaryListItem fileName={file.friendly} onCloseClick={() => {outboxAPI.discard(file.id, {delIdx: i, selIdx: activeSFile});}} />}
                        passHoverToLabel={true}
                        buttonAction={() => {setSelectedSFile(i);}}
                        selected={activeSFile === i}
                        enabled={true}
                        customStyle={{borderRadius: "6px", width: "94%", height: "30px", margin: "0 auto 0 auto"}}
                        shadeA={"#282828"}
                        shadeB={"#303030"}
                        shadeC={"#343434"}
                        />
                    )) : null}
                    </div>
                </div>
                <div style={{flexGrow: "1"}} onClick={() => {setSelectedSFile(null);}} />
            </div>
            {activeSFile !== null ? (
            <div id="right-detail-panel" style={{
            verticalAlign: "top",
            backgroundColor: "#303030",
            borderRadius: "8px",
            margin: "10px 10px 10px 0",
            width: "200px",
            flexGrow: 1,
            height: "calc(100% - 20px)",
            }}>
                <ServedItem key={hostedFiles[activeSFile]?.id} filename={hostedFiles[activeSFile]?.friendly} url={`${protocol}://${ip}:${port}/get/${hostedFiles[activeSFile]?.id}`} size={hostedFiles[activeSFile]?.size} />
            </div>
            ) : null}
        </div>
    );
}

const Inbox = ({setSelectedNavPage, setSelectedRFile, inboxItems, setinboxItems, activeRFile, hasCurrentFileBeenSaved, savePaths, protocol, ip, port}) => {

    return (
        <div style={{display: "flex", flexDirection: "row", height: "100%", width: "100%"}}>
            <div id="left-summary-panel" onClick={()=>{setSelectedRFile(null);}}>
            <div id="recv-panel" style={{display: "flex", flexDirection: "column", height: "100%"}}>
                <div className="left-recv-header" onClick={() => {setSelectedRFile(null);}} style={{ display: "flex", justifyItems: "space-between", flexDirection: "column" }}>
                    <h4 style={{marginBottom: "3px", marginTop: "5px", marginLeft: "12px" }}>Inbox</h4>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "space-between", height: "25px"}}>
                        <span className="simple-text" style={{margin: "auto", marginLeft: "13px", fontSize: "0.8rem", height: "fit-content"}}>{inboxItems.length} item{inboxItems.length !== 1 ? "s" : ""}</span>
                    </div>
                </div>

                <div style={{display: "flex", flexDirection: "column", gap: "4px", maxHeight: "fit-content", overflowY: "auto", marginLeft: "0", marginRight: "0", marginTop: "4px"}}>
                    {inboxItems.map((file, i) => (
                        <ResponsiveButton
                        key={file.id}
                        label={<SummaryListItem fileName={file.friendly} onCloseClick={() => inboxAPI.discard(file.id, {delIdx: i, selIdx: activeRFile})} />}
                        passHoverToLabel={true}
                        buttonAction={() => {setSelectedRFile(i)}}
                        selected={activeRFile === i}
                        enabled={true}
                        customStyle={{borderRadius: "6px", width: "94%", height: "30px", margin: "0 auto 0 auto"}}
                        shadeA={"#282828"}
                        shadeB={"#303030"}
                        shadeC={"#343434"}
                        />
                    ))}
                </div>
                <div style={{flex: "1"}} onClick={() => {setSelectedRFile(null);}} />
            </div>
            </div>
            {activeRFile === null ? (
            <div id="right-blank-panel" style={{width: "200px", flexGrow: 1}}>
                <div style={{color: "white", fontSize: "0.9rem", margin: "0 auto", width: "100%", textAlign: "center"}}>Share this QR code to allow others to send you files:</div>
                <div style={{width: "fit-content", margin: "0 auto", marginTop: "20px"}}>
                <QrComponent url={`${protocol}://${ip}:${port}/send`} alignment="center" shadeA="#282828" shadeB="#303030" shadeC="#383838" />
                </div>
            </div>
            ) : (
            <div id="right-detail-panel" style={{
                verticalAlign: "top",
                backgroundColor: "#303030",
                borderRadius: "8px",
                marginRight: "10px",
                width: "200px",
                flexGrow: 1,
                marginTop: "10px",
                marginBottom: "10px",
                height: "calc(100% - 20px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "center",
                overflowWrap: "break-word",
                whiteSpace: "normal",
            }}>
                <div style={{display: "flex", flexDirection: "row", width: "calc(100% - 10px)", marginRight: "10px"}}>
                    <div style={{display: "flex", flexGrow: 1, margin: "10px", width: "calc(100% - 270px - 20px)"}}>
                        <SimpleTextHeader primaryText={inboxItems[activeRFile]?.friendly} secondaryText={`Size: ${inboxItems[activeRFile]?.size < 1024 ? `${inboxItems[activeRFile]?.size} B` : inboxItems[activeRFile]?.size < 1048576 ? `${(inboxItems[activeRFile]?.size / 1024).toFixed(2)} KB` : `${(inboxItems[activeRFile]?.size / 1048576).toFixed(2)} MB`}`} />
                    </div>

                    <div style={{display: "flex", flexDirection: "column"}}>
                        <div style={{width: "270px", display: "flex", flexDirection: "row", alignItems: "start", justifyContent: "space-around", fontSize: "13px"}}>
                            {inboxItems[activeRFile]?.type === "url" ? (
                                <ResponsiveButton
                                label={"Open URL"}
                                buttonAction={async () => {window.location.href = inboxItems[activeRFile].buffer;}}
                                selected={false}
                                enabled={true}
                                customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                                shadeA={"#303030"}
                                shadeB={"#383838"}
                                shadeC={"#404040"}
                                />
                            ) : (
                                null
                            )}

                            
                            {inboxItems[activeRFile]?.type === "text" || inboxItems[activeRFile]?.type === "url" ? (
                                <ResponsiveButton
                                label={"Copy"}
                                buttonAction={async () => {console.log("item: ", inboxItems[activeRFile]); navigator.clipboard.writeText(inboxItems[activeRFile].buffer);}}
                                selected={false}
                                enabled={true}
                                customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                                shadeA={"#303030"}
                                shadeB={"#383838"}
                                shadeC={"#404040"}
                                />
                            ) : null}

                            {inboxItems[activeRFile]?.type === "file" ? (
                                <ResponsiveButton
                                label={"Open"}
                                buttonAction={() => {inboxAPI.open(inboxItems[activeRFile].id);}}
                                selected={false}
                                enabled={true}
                                customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                                disabledStyle={{color: "#808080"}}
                                shadeA={"#303030"}
                                shadeB={"#383838"}
                                shadeC={"#404040"}
                                />
                            ): null}

                            {inboxItems[activeRFile]?.type === "file" || inboxItems[activeRFile]?.type === "text" ? (
                                hasCurrentFileBeenSaved() ? (
                                    <ResponsiveButton
                                    label={"Reveal"}
                                    buttonAction={() => {inboxAPI.reveal(inboxItems[activeRFile].id);}}
                                    selected={false}
                                    enabled={hasCurrentFileBeenSaved()}
                                    customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                                    disabledStyle={{color: "#808080"}}
                                    shadeA={"#303030"}
                                    shadeB={"#383838"}
                                    shadeC={"#404040"}
                                    />
                                ) : (
                                    <div style={{display: "flex", flexDirection: "row"}}>
                                        <ResponsiveButton
                                        label={hasCurrentFileBeenSaved() ? "Saved" : "Save"}
                                        buttonAction={() => {inboxAPI.save(inboxItems[activeRFile].id);}}
                                        selected={false}
                                        enabled={!hasCurrentFileBeenSaved()}
                                        disabledStyle={{color: "#808080"}}
                                        customStyle={{display: "flex", width: "50px", height: "35px", borderRadius: "6px 0 0 6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                                        shadeA={"#303030"}
                                        shadeB={"#383838"}
                                        shadeC={"#404040"}
                                        />

                                        <ResponsiveButton
                                        label={"as..."}
                                        buttonAction={() => {inboxAPI.save(inboxItems[activeRFile].id, "manual");}}
                                        selected={false}
                                        enabled={!hasCurrentFileBeenSaved()}
                                        disabledStyle={{color: "#808080"}}
                                        customStyle={{display: "flex", width: "30px", height: "35px", borderRadius: "0 6px 6px 0", justifyContent: "center", alignItems: "center", marginTop: "20px"}}
                                        shadeA={"#303030"}
                                        shadeB={"#383838"}
                                        shadeC={"#404040"}
                                        />
                                    </div>
                                )
                            ) : null}

                            <ResponsiveButton
                            label={"Discard"}
                            buttonAction={() => inboxAPI.discard(inboxItems[activeRFile].id, {delIdx: activeRFile, selIdx: activeRFile})}
                            selected={false}
                            enabled={true}
                            customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                            shadeA={"#303030"}
                            shadeB={"#983838"}
                            shadeC={"#c04040"}
                            />
                        </div>
                        <div style={{display: "flex", flexDirection: "row", justifyContent: "start", fontSize: "13px"}}>
                            <ResponsiveButton
                            label={"Copy to Outbox"}
                            buttonAction={async () => {inboxAPI.copyToOutbox(inboxItems[activeRFile].id); setSelectedNavPage(0);}}
                            selected={false}
                            enabled={true}
                            customStyle={{display: "flex", width: "80px", height: "35px", borderRadius: "6px", justifyContent: "center", alignItems: "center", marginTop: "20px", marginLeft: "10px"}}
                            shadeA={"#303030"}
                            shadeB={"#383838"}
                            shadeC={"#404040"}
                            />
                        </div>
                    </div>
                </div>
                <div style={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "flex-start", width: "100%", height: "40px", boxSizing: "border-box"}}>
                <div style={{width: "18px", flexGrow: 0}} />
                <div style={{width: "1px", flexGrow: 1, color: "#808080", fontStyle: "italic"}}>{savePaths[inboxItems[activeRFile]?.id] ? "Saved to " + savePaths[inboxItems[activeRFile]?.id] : ""}</div>
                </div>
            </div>
            )}
        </div>
    );
}

export { Outbox, Inbox };