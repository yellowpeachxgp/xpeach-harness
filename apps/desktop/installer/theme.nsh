; Figma logical pixels, independent of the Windows display scale.
!define INSTALLER_WINDOW_SIZE 600
!define INSTALLER_BRAND_Y 174
!define INSTALLER_BRAND_HEIGHT 196
!define INSTALLER_BUTTON_X 240
!define INSTALLER_BUTTON_Y 490
!define INSTALLER_BUTTON_WIDTH 120
!define INSTALLER_BUTTON_HEIGHT 44
!define INSTALLER_BUTTON_DIAMETER 20
!define INSTALLER_PROGRESS_X 64
!define INSTALLER_PROGRESS_Y 482
!define INSTALLER_PROGRESS_WIDTH 472
!define INSTALLER_PROGRESS_HEIGHT 6
!define INSTALLER_PROGRESS_DIAMETER 4
!define INSTALLER_STATUS_Y 512
!define INSTALLER_STATUS_HEIGHT 22
!define INSTALLER_FONT "Microsoft YaHei UI"
!define INSTALLER_BUTTON_FONT_SIZE 16
!define INSTALLER_STATUS_FONT_SIZE 14
; GDI+ ARGB values; GDI text uses COLORREF below.
; Primary actions use the XPeach identity orange (brand ramp: #F17C52 base,
; #E0653F hover, #CC5C33 pressed) so the installer reads as the same product.
!define INSTALLER_PRIMARY 0xFFF17C52
!define INSTALLER_PRIMARY_HOVER 0xFFE0653F
!define INSTALLER_PRIMARY_PRESSED 0xFFCC5C33
!define INSTALLER_CONTROL_HOVER 0xFFFDEDE6
!define INSTALLER_TRACK_COLOR 0xFFF7D8C9
!define INSTALLER_TEXT_COLORREF 0x15110F
!define INSTALLER_ACCENT_COLORREF 0xF17C52

Var InstallerTheme
Var InstallerBgHex
Var InstallerTextHex
Var InstallerBgArgb
Var InstallerBgColorref
Var InstallerTextColorref
Var InstallerPrimary
Var InstallerPrimaryHover
Var InstallerPrimaryPressed
Var InstallerControlHover
Var InstallerTrack
Var InstallerButtonText
Var InstallerBorder

; SetCtlColors accepts only compile-time colors; choose between the two native palettes.
!macro InstallerControlColors HANDLE
    ${If} $InstallerTheme == "dark"
        SetCtlColors ${HANDLE} FFFFFF 151517
    ${Else}
        SetCtlColors ${HANDLE} 0F1115 FFFFFF
    ${EndIf}
!macroend

Function InstallerResolveTheme
    ${If} $InstallerTheme == "auto"
        ClearErrors
        ReadRegDWORD $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" "AppsUseLightTheme"
        ${If} ${Errors}
            StrCpy $0 1
        ${EndIf}
        ${If} $0 == 0
            StrCpy $InstallerTheme "dark"
        ${Else}
            StrCpy $InstallerTheme "light"
        ${EndIf}
    ${EndIf}
    ${If} $InstallerTheme == "dark"
        StrCpy $InstallerBgHex "151517"
        StrCpy $InstallerTextHex "FFFFFF"
        StrCpy $InstallerBgArgb 0xFF151517
        StrCpy $InstallerBgColorref 0x171515
        StrCpy $InstallerTextColorref 0xFFFFFF
        StrCpy $InstallerPrimary 0xFFE8703F
        StrCpy $InstallerPrimaryHover 0xFFF17C52
        StrCpy $InstallerPrimaryPressed 0xFFCC5C33
        StrCpy $InstallerControlHover 0xFF3A2A22
        StrCpy $InstallerTrack 0xFF5A443A
        StrCpy $InstallerButtonText 0xFFFFFF
        StrCpy $InstallerBorder 0xFF5A443A
    ${Else}
        StrCpy $InstallerBgHex "FFFFFF"
        StrCpy $InstallerTextHex "0F1115"
        StrCpy $InstallerBgArgb 0xFFFFFFFF
        StrCpy $InstallerBgColorref 0xFFFFFF
        StrCpy $InstallerTextColorref ${INSTALLER_TEXT_COLORREF}
        StrCpy $InstallerPrimary ${INSTALLER_PRIMARY}
        StrCpy $InstallerPrimaryHover ${INSTALLER_PRIMARY_HOVER}
        StrCpy $InstallerPrimaryPressed ${INSTALLER_PRIMARY_PRESSED}
        StrCpy $InstallerControlHover ${INSTALLER_CONTROL_HOVER}
        StrCpy $InstallerTrack ${INSTALLER_TRACK_COLOR}
        StrCpy $InstallerButtonText 0xFFFFFF
        StrCpy $InstallerBorder 0xFFBBC0C8
    ${EndIf}
FunctionEnd
