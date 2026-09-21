import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';
import { getUserProfile } from '../services/AuthCall';
import { useNavigate } from 'react-router-dom';
import '../style/UserProfileManifest.css';
import Overview from './profile/Overview';
import MatrixStats from './profile/MatrixStats';
import { LayoutDashboard, BarChart3, User } from 'lucide-react';

export default function UserDashboard() {
    const { user, handleLogout } = useContext(UserContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOverview, setIsOverview] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const data = await getUserProfile();
                if (!data || !data.success) {
                    return navigate('/auth');
                }
                setProfile(data.profile);
            } catch (err) {
                console.error("Dashboard link exception:", err);
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();   
    }, [navigate]);

    if (loading) {
        return (
            <div className="void-loader-container">
                <div className="void-scanner-box">
                    <div className="scanner-line"></div>
                    <div className="pulse-ring"></div>
                    <div className="loader-brand">SYS_INIT</div>
                </div>
                <div className="loader-status-text">
                    <span className="terminal-prompt">&gt;</span> SYNCHRONIZING_DASHBOARD...
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-shell">
            <div className="profile-subnav-container">
                <div className="profile-subnav-tabs">
                    <button 
                        className={`btn ${activeTab === 'overview' ? 'active' : ''}`} 
                        onClick={() => { setActiveTab('overview'); setIsOverview(true); }}
                    >
                        <LayoutDashboard size={15} />
                        <span>OVERVIEW</span>
                    </button>
                    <button 
                        className={`btn ${activeTab === 'analytics' ? 'active' : ''}`} 
                        onClick={() => { setActiveTab('analytics'); setIsOverview(false); }}
                    >
                        <BarChart3 size={15} />
                        <span>METRICS</span>
                    </button>
                </div>
                <div className="profile-subnav-actions">
                    <span className="profile-operator-badge">
                        <User size={13} />
                        <span>{user?.username || profile?.username || 'OPERATOR'}</span>
                    </span>
                    <button className="logout-btn" onClick={() => handleLogout()} title="Sign out of operator session">
                        ⏻ LOGOUT
                    </button>
                </div>
            </div>

            {isOverview ? (
                <Overview
                    username={profile?.username} 
                    email={profile?.email}
                    isVerified={profile?.isVerified} 
                    createdAt={profile?.createdAt}
                />
            ) : (
                <MatrixStats 
                    stats={profile?.stats}
                />
            )}
        </div>
    );
}