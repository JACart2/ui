/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Drawer, Switch } from "antd";
import { useState } from "react";
import { FaCode } from "react-icons/fa6";

import './DevMenu.css'

export default function DevMenu({ vehicleState, setVehicleState, isNewUser, setIsNewUser }: any) {
    const [open, setOpen] = useState(false);

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

                {/* Add a new switch for toggling new user state */}
                <h3>User State</h3>
                <div className="label-input">
                    <Switch checked={isNewUser} onChange={(checked) => setIsNewUser(checked)} />
                    <span>is_new_user</span>
                </div>
            </Drawer>
        </>
    );
}