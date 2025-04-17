/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Drawer, Switch, Select, message } from "antd";
import { useState } from "react";
import { FaCode } from "react-icons/fa6";
import { useTTS } from '../useTTS';
import './DevMenu.css'

export default function DevMenu({ vehicleState, setVehicleState, isNewUser, setIsNewUser }: any) {
    const [open, setOpen] = useState(false);
    const { voices, selectedVoice, setSelectedVoice, testVoice } = useTTS();

    function openDrawer() {
        setOpen(true);
    }

    function closeDrawer() {
        setOpen(false);
    }

    function editState(data: any) {
        setVehicleState({
            ...vehicleState,
            ...data
        });
    }

    const handleVoiceChange = (voiceName: string) => {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
            setSelectedVoice(voice);
            testVoice(voice, "This is the new selected voice.");
        }
    };

    const handleTestVoice = () => {
        if (selectedVoice) {
            testVoice(selectedVoice, "This is a test of the current voice selection.");
        } else {
            message.warning("No voice selected");
        }
    };

    return (
        <>
            <div id="dev-menu-handle" onClick={openDrawer}><FaCode /></div>

            <Drawer
                title="Dev Tools"
                onClose={closeDrawer}
                open={open}
                maskClassName="invisible-mask"
                footer={
                    <Button className="close-button" onClick={closeDrawer}>Close</Button>
                }
            >
                <h3>Vehicle State</h3>
                <div className="label-input">
                    <Switch checked={vehicleState.is_navigating} onChange={(checked) => editState({ is_navigating: checked })} />
                    <span>is_navigating</span>
                </div>
                <div className="label-input">
                    <Switch checked={vehicleState.reached_destination} onChange={(checked) => editState({ reached_destination: checked })} />
                    <span>reached_destination</span>
                </div>
                <div className="label-input">
                    <Switch checked={vehicleState.stopped} onChange={(checked) => editState({ stopped: checked })} />
                    <span>stopped</span>
                </div>

                <h3>User State</h3>
                <div className="label-input">
                    <Switch checked={isNewUser} onChange={(checked) => { closeDrawer(); setIsNewUser(checked); editState({ is_navigating: checked }) }} />
                    <span>is_new_user</span>
                </div>

                {voices.length > 0 && (
                    <>
                        <h3>TTS Voice Settings</h3>
                        <div className="label-input" style={{ marginBottom: '16px' }}>
                            <span>Voice:</span>
                            <Select
                                style={{ width: '100%', marginTop: '8px' }}
                                value={selectedVoice?.name}
                                onChange={handleVoiceChange}
                                options={voices
                                    .filter(voice => voice.lang.includes('en'))
                                    .map(voice => ({
                                        value: voice.name,
                                        label: `${voice.name} (${voice.lang})`
                                    }))}
                            />
                        </div>
                        <Button 
                            style={{ marginBottom: '16px' }}
                            onClick={handleTestVoice}
                            disabled={!selectedVoice}
                        >
                            Test Voice
                        </Button>
                    </>
                )}
            </Drawer>
        </>
    );
}
