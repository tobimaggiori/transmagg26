VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{FF19AA0C-2968-41B8-A906-E80997A9C394}#253.0#0"; "WSAFIPFEOCX.ocx"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form NotasCredito1 
   BackColor       =   &H80000007&
   Caption         =   "Notas de Creditos - Reingresar"
   ClientHeight    =   6390
   ClientLeft      =   120
   ClientTop       =   450
   ClientWidth     =   7995
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   Picture         =   "NotasCreditos1.frx":0000
   ScaleHeight     =   10950
   ScaleWidth      =   20250
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   1
      Left            =   2280
      TabIndex        =   3
      Text            =   "Text2"
      Top             =   480
      Width           =   1695
   End
   Begin VB.TextBox Text2 
      Height          =   285
      Index           =   0
      Left            =   1320
      TabIndex        =   2
      Text            =   "Text2"
      Top             =   480
      Width           =   855
   End
   Begin VB.ComboBox TipoComp 
      Height          =   315
      Left            =   1320
      TabIndex        =   0
      Top             =   0
      Width           =   1935
   End
   Begin VB.TextBox Text1 
      BeginProperty DataFormat 
         Type            =   1
         Format          =   "dd/MM/yyyy"
         HaveTrueFalseNull=   0
         FirstDayOfWeek  =   0
         FirstWeekOfYear =   0
         LCID            =   11274
         SubFormatType   =   3
      EndProperty
      Height          =   285
      Index           =   0
      Left            =   6240
      TabIndex        =   28
      Text            =   "Text1"
      Top             =   1200
      Visible         =   0   'False
      Width           =   1455
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   1320
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   840
      Width           =   855
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   2280
      TabIndex        =   27
      Text            =   "Text1"
      Top             =   840
      Width           =   3615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   120
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   1680
      Width           =   3615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   4
      Left            =   3840
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   1680
      Width           =   855
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   5
      Left            =   4800
      TabIndex        =   7
      Text            =   "Text1"
      Top             =   1680
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   5040
      TabIndex        =   25
      Text            =   "Text1"
      Top             =   4200
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   5040
      TabIndex        =   24
      Text            =   "Text1"
      Top             =   4560
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   8
      Left            =   5040
      TabIndex        =   23
      Text            =   "Text1"
      Top             =   4920
      Width           =   1215
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Empresa"
      Height          =   195
      Index           =   0
      Left            =   6360
      TabIndex        =   22
      Top             =   1080
      Width           =   1215
   End
   Begin VB.OptionButton Option1 
      Caption         =   "Fletero"
      Height          =   195
      Index           =   1
      Left            =   6360
      TabIndex        =   21
      Top             =   840
      Width           =   1215
   End
   Begin VB.Frame InfAdi 
      BackColor       =   &H80000007&
      Caption         =   "Info Adicional"
      ForeColor       =   &H0080C0FF&
      Height          =   2295
      Left            =   120
      TabIndex        =   9
      Top             =   4200
      Width           =   3615
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   11
         Left            =   1680
         TabIndex        =   15
         Text            =   "Text1"
         Top             =   1320
         Width           =   1335
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   10
         Left            =   2400
         TabIndex        =   14
         Text            =   "Text1"
         Top             =   960
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   9
         Left            =   1680
         TabIndex        =   13
         Text            =   "Text1"
         Top             =   960
         Width           =   615
      End
      Begin VB.OptionButton Option2 
         BackColor       =   &H00000000&
         Caption         =   "Anula S/enviar"
         ForeColor       =   &H0080C0FF&
         Height          =   195
         Index           =   0
         Left            =   240
         TabIndex        =   12
         Top             =   1800
         Width           =   1815
      End
      Begin VB.OptionButton Option2 
         BackColor       =   &H00000000&
         Caption         =   "Rechazada"
         ForeColor       =   &H0080C0FF&
         Height          =   195
         Index           =   2
         Left            =   1920
         TabIndex        =   11
         Top             =   1800
         Width           =   1335
      End
      Begin VB.TextBox Text1 
         BeginProperty DataFormat 
            Type            =   1
            Format          =   "dd/MM/yyyy"
            HaveTrueFalseNull=   0
            FirstDayOfWeek  =   0
            FirstWeekOfYear =   0
            LCID            =   11274
            SubFormatType   =   3
         EndProperty
         Height          =   285
         Index           =   12
         Left            =   1680
         TabIndex        =   10
         Text            =   "Text1"
         Top             =   600
         Width           =   615
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Fecha"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   10
         Left            =   120
         TabIndex        =   20
         Top             =   1320
         Width           =   1575
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000001&
         Caption         =   "Aplicar a Factura"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   9
         Left            =   120
         TabIndex        =   19
         Top             =   960
         Width           =   1575
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000001&
         Caption         =   "Tipo de Comp"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   11
         Left            =   120
         TabIndex        =   18
         Top             =   240
         Width           =   1575
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000001&
         Caption         =   "Tipo de Comp"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   12
         Left            =   1680
         TabIndex        =   17
         Top             =   240
         Width           =   1575
      End
      Begin VB.Label Label1 
         Appearance      =   0  'Flat
         BackColor       =   &H80000001&
         Caption         =   "Cod Comp"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   13
         Left            =   120
         TabIndex        =   16
         Top             =   600
         Width           =   1575
      End
   End
   Begin WSAFIPFEOCX.WSAFIPFEx NCFE 
      Left            =   120
      Top             =   840
      _ExtentX        =   1720
      _ExtentY        =   661
   End
   Begin MSMask.MaskEdBox FechaNC 
      Height          =   285
      Left            =   4560
      TabIndex        =   1
      Top             =   0
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSComctlLib.ListView CuerpoNC 
      Height          =   1935
      Left            =   120
      TabIndex        =   26
      Top             =   2160
      Width           =   6135
      _ExtentX        =   10821
      _ExtentY        =   3413
      View            =   3
      LabelWrap       =   0   'False
      HideSelection   =   0   'False
      FullRowSelect   =   -1  'True
      GridLines       =   -1  'True
      _Version        =   393217
      ForeColor       =   -2147483640
      BackColor       =   -2147483643
      BorderStyle     =   1
      Appearance      =   1
      NumItems        =   4
      BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         Text            =   "Descripcion"
         Object.Width           =   5644
      EndProperty
      BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   1
         Text            =   "IVA"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   2
         Text            =   "SubTotal"
         Object.Width           =   2540
      EndProperty
      BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
         SubItemIndex    =   3
         Text            =   "Alicuota"
         Object.Width           =   2540
      EndProperty
   End
   Begin KewlButtonz.KewlButtons AgregarCHP 
      Height          =   375
      Left            =   6240
      TabIndex        =   8
      Top             =   1680
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   661
      BTYPE           =   1
      TX              =   "Agregar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NotasCreditos1.frx":0342
      PICN            =   "NotasCreditos1.frx":035E
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   495
      Left            =   3960
      TabIndex        =   29
      Top             =   5400
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Grabar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NotasCreditos1.frx":23E0
      PICN            =   "NotasCreditos1.frx":23FC
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Cancelar 
      Height          =   495
      Left            =   5520
      TabIndex        =   30
      Top             =   5400
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Cancelar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "NotasCreditos1.frx":447E
      PICN            =   "NotasCreditos1.frx":449A
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Nro NC:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   14
      Left            =   0
      TabIndex        =   40
      Top             =   480
      Width           =   1815
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Tipo de NC:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   0
      TabIndex        =   39
      Top             =   0
      Width           =   1335
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   1
      Left            =   3360
      TabIndex        =   38
      Top             =   0
      Width           =   1335
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Cliente:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   2
      Left            =   0
      TabIndex        =   37
      Top             =   840
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Descripcion"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   3
      Left            =   120
      TabIndex        =   36
      Top             =   1320
      Width           =   3615
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Por IVA"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   4
      Left            =   3720
      TabIndex        =   35
      Top             =   1320
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Neto"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   5
      Left            =   4800
      TabIndex        =   34
      Top             =   1320
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "SubTotal"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   6
      Left            =   3600
      TabIndex        =   33
      Top             =   4200
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "IVA"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   7
      Left            =   3600
      TabIndex        =   32
      Top             =   4560
      Width           =   1335
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Total"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   8
      Left            =   3720
      TabIndex        =   31
      Top             =   4920
      Width           =   1335
   End
End
Attribute VB_Name = "NotasCredito1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TNC As Double, TIVA As Double, TNeto As Double
Private Cuerpo As ListItem
Dim UltNro As String, FVto As String, FServD As String, FservH As String, FPago As String, VNetoFE As Double
Dim VivaFE As Double, FCte As String, VCUIT As String, VTipoDoc As Single, VIndice As Long, VtipoComp
Dim VCAE As String, VMOTIVO As String, VProceso As String, VNro As String
Private Sub genera_cae_nc()
If NCFE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   Me.NCFE.ArchivoCertificadoPassword = "hercasa1509"
   If NCFE.f1ObtenerTicketAcceso() Then
      NCFE.F1CabeceraCantReg = 1
      NCFE.F1CabeceraPtoVta = 4
      NCFE.F1CabeceraCbteTipo = 3
      
      NCFE.f1Indice = 0
      NCFE.F1DetalleConcepto = 2
      NCFE.F1DetalleDocTipo = VTipoDoc
      NCFE.F1DetalleDocNro = VCUIT
      NCFE.F1DetalleCbteDesde = VNro
      NCFE.F1DetalleCbteHasta = VNro
      NCFE.F1DetalleCbteFch = FCte
      NCFE.F1DetalleImpTotal = FormatNumber(TNC)
      NCFE.F1DetalleImpTotalConc = 0
      NCFE.F1DetalleImpNeto = FormatNumber(TNeto)
      NCFE.F1DetalleImpOpEx = 0
      NCFE.F1DetalleImpTrib = 0
      NCFE.F1DetalleImpIva = FormatNumber(TIVA)
      NCFE.F1DetalleFchServDesde = FServD
      NCFE.F1DetalleFchServHasta = FservH
      NCFE.F1DetalleFchVtoPago = FPago
      NCFE.F1DetalleMonIdS = "PES"
      NCFE.F1DetalleMonCotiz = 1
      NCFE.F1DetalleIvaItemCantidad = 1
      NCFE.f1IndiceItem = 0
      
  
     
    If TIVA = 0 Then
            NCFE.F1DetalleIvaId = 3
            NCFE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NCFE.F1DetalleIvaImporte = FormatNumber(TIVA)
     Else
            NCFE.F1DetalleIvaId = 5
            NCFE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NCFE.F1DetalleIvaImporte = FormatNumber(TIVA)
    End If
    

    NCFE.F1DetalleCbtesAsocItemCantidad = 1
    NCFE.f1IndiceItem = 0
    NCFE.F1DetalleCbtesAsocTipo = 1
    NCFE.F1DetalleCbtesAsocPtoVta = Text1(9)
    NCFE.F1DetalleCbtesAsocNroS = Text1(10)
      'NCFE.F1DetalleCbtesAsocItemCantidad = 0
      'NCFE.F1DetalleOpcionalItemCantidad = 0

    NCFE.ArchivoXMLRecibido = App.Path & "\XML\recibido.xml"
    NCFE.ArchivoXMLEnviado = App.Path & "\XML\enviado.xml"

      lResultado = NCFE.F1CAESolicitar()
      
     If lResultado Then
         MsgBox ("NOTA DE CREDITO Generada")
      Else
         MsgBox ("Error de Solicitud de CAE")
      End If
      'MsgBox ("error local: " + ncfe.UltimoMensajeError)
      'MsgBox ("resultado global AFIP: " + ncfe.F1RespuestaResultado)
      'MsgBox ("es reproceso? " + ncfe.F1RespuestaReProceso)
      'MsgBox ("registros procesados por AFIP: " + Str(ncfe.F1RespuestaCantidadReg))
      'MsgBox ("error genérico global:" + ncfe.f1ErrorMsg1)
      If NCFE.F1RespuestaCantidadReg > 0 Then
        'ncfe.f1Indice = 0
        'MsgBox ("resultado detallado comprobante: " + ncfe.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + ncfe.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + ncfe.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + ncfe.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + NCFE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + NCFE.UltimoMensajeError)
End If
End Sub
Private Sub GeneraCAE_Pyme()
If NCFE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   Me.NCFE.ArchivoCertificadoPassword = "hercasa1509"
   If NCFE.f1ObtenerTicketAcceso() Then
      NCFE.F1CabeceraCantReg = 1
      NCFE.F1CabeceraPtoVta = 4
      NCFE.F1CabeceraCbteTipo = 203
      
      NCFE.f1Indice = 0
      NCFE.F1DetalleConcepto = 2
      NCFE.F1DetalleDocTipo = VTipoDoc
      NCFE.F1DetalleDocNro = VCUIT
      NCFE.F1DetalleCbteDesde = VNro
      NCFE.F1DetalleCbteHasta = VNro
      NCFE.F1DetalleCbteFch = FCte
      NCFE.F1DetalleImpTotal = FormatNumber(TNC)
      NCFE.F1DetalleImpTotalConc = 0
      NCFE.F1DetalleImpNeto = FormatNumber(TNeto)
      NCFE.F1DetalleImpOpEx = 0
      NCFE.F1DetalleImpTrib = 0
      NCFE.F1DetalleImpIva = FormatNumber(TIVA)
      NCFE.F1DetalleFchServDesde = FServD
      NCFE.F1DetalleFchServHasta = FservH
      'NCFE.F1DetalleFchVtoPago = FPago
      NCFE.F1DetalleMonIdS = "PES"
      NCFE.F1DetalleMonCotiz = 1
      NCFE.F1DetalleIvaItemCantidad = 1
      NCFE.f1IndiceItem = 0
      
  
     
    If TIVA = 0 Then
            NCFE.F1DetalleIvaId = 3
            NCFE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NCFE.F1DetalleIvaImporte = FormatNumber(TIVA)
     Else
            NCFE.F1DetalleIvaId = 5
            NCFE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NCFE.F1DetalleIvaImporte = FormatNumber(TIVA)
    End If

    NCFE.F1DetalleCbtesAsocItemCantidad = 1
    NCFE.f1IndiceItem = 0
    NCFE.F1DetalleCbtesAsocTipo = 201
    NCFE.F1DetalleCbtesAsocPtoVta = Text1(9)
    NCFE.F1DetalleCbtesAsocNroS = Text1(10)
    
    NCFE.F1DetalleCbtesAsocCUIT = "30709381683"
    FVto = Mid(Text1(11), 7, 4) & Mid(Text1(11), 4, 2) & Mid(Text1(11), 1, 2)
    NCFE.F1DetalleCbtesAsocFecha = FVto
      
    NCFE.F1DetalleOpcionalItemCantidad = 1
    NCFE.f1IndiceItem = 0
    NCFE.F1DetalleOpcionalId = 22
    If Option2(0).Value = True Then
        NCFE.F1DetalleOpcionalValor = "N"
    Else
        NCFE.F1DetalleOpcionalValor = "S"
    End If
    NCFE.ArchivoXMLRecibido = App.Path + "\XML\recibido.xml"
    NCFE.ArchivoXMLEnviado = App.Path + "\XML\enviado.xml"

      lResultado = NCFE.F1CAESolicitar()
      
     If lResultado Then
         MsgBox ("NOTA DE CREDITO Generada")
      Else
         MsgBox ("Error de Solicitud de CAE")
      End If
      'MsgBox ("error local: " + ncfe.UltimoMensajeError)
      'MsgBox ("resultado global AFIP: " + ncfe.F1RespuestaResultado)
      'MsgBox ("es reproceso? " + ncfe.F1RespuestaReProceso)
      'MsgBox ("registros procesados por AFIP: " + Str(ncfe.F1RespuestaCantidadReg))
      'MsgBox ("error genérico global:" + ncfe.f1ErrorMsg1)
      If NCFE.F1RespuestaCantidadReg > 0 Then
        'ncfe.f1Indice = 0
        'MsgBox ("resultado detallado comprobante: " + ncfe.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + ncfe.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + ncfe.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + ncfe.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + NCFE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + NCFE.UltimoMensajeError)
End If

End Sub
Private Sub GENERA_NC_CTA()
Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where TipoFact = 5 order by NroFact")
    Set rsDetFact = db.OpenRecordset("DetFact")
    'busca número Factura
    lPrimaryKey = GetPrimaryKey
    'graba encabezado
    With rsEncabFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = FechaNC
        .Fields("Codigo") = Text1(1)
        .Fields("TipoFact") = 5 '4 - 5 NC A
        .Fields("TNeto") = FormatNumber(TNeto)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TNC)
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To CuerpoNC.ListItems.Count
        Set Cuerpo = CuerpoNC.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Cuerpo.Tag
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Update
        End With
    Next
    'GRABA FACTURA EN CTA CTE
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = FechaNC
        .Fields("CodEmp") = Text1(1)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 2
        .Fields("Haber") = FormatNumber(TNC)
        .Fields("SaldoComp") = FormatNumber(TNC)
        .Update
    End With
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set rsCtaCteEmp = Nothing
    Call Imprime_NCA(lPrimaryKey)
End Sub
Private Sub GENERA_NC1()
On Error Resume Next
    Dim DescCliente As String, CuitClient As String, DirCliente As String, LocCliente As String
    Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 17 order by NroFe")
    Set rsDetFact = db.OpenRecordset("DetFE")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    'busca número nota de credito
      lPrimaryKey = Text2(1)
    'lPrimaryKey = GetPrimaryKey
    VNro = lPrimaryKey
    'GENERA CAE
    'llena variables
    FVto = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FServD = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FservH = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FPago = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    VNetoFE = FormatNumber(TNeto)
    VivaFE = FormatNumber(TIVA)
    FCte = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    If Option1(0).Value = True Then
        Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(1) & "")
        VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        DescCliente = rsEmpresas!DescEmpresas
        CuitClient = rsEmpresas!cuit
        DirCliente = rsEmpresas!Direccion
        LocCliente = rsEmpresas!Localidad
    Else
        Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(1) & "")
        VCUIT = Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        DescCliente = rsFleteros!DescFlet
        CuitClient = rsFleteros!cuit
        DirCliente = rsFleteros!Direccion
        LocCliente = rsFleteros!Localidad
    End If
    VTipoDoc = 80
    VtipoComp = 3
    Set rsEncabFact = db.OpenRecordset("EncabFE")
    If rsEncabFact.EOF Then
        VIndice = 0
    Else
        rsEncabFact.MoveLast
        VIndice = rsEncabFact!indice + 1
    End If
    
    With rsEncabFact
        .AddNew
        .Fields("Indice") = VIndice
        .Fields("PtoVtaFE") = 4
        .Fields("NroFE") = lPrimaryKey
        .Fields("FechaFE") = FechaNC
        .Fields("CodClie") = Text1(1)
        .Fields("TotalNetoFE") = VNetoFE
        .Fields("TotalIvaFE") = VivaFE
        .Fields("TotalGralFE") = FormatNumber(TNC)
        .Fields("TipoAfip") = 3
        .Fields("TipoSistema") = 17
        .Fields("FVto") = FVto
        .Fields("FservD") = FServD
        .Fields("FservH") = FservH
        .Fields("FPago") = FPago
        .Fields("ClaseFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión, 3 - Nota de Credito
        'Call genera_cae_nc
        '.Fields("CAE") = NCFE.F1RespuestaDetalleCae
        '.Fields("VtoCAE") = NCFE.F1RespuestaDetalleCAEFchVto
        '.Fields("ObsCAE") = NCFE.F1RespuestaDetalleResultado
        '.Fields("MotivoCAE") = NCFE.F1RespuestaDetalleObservacionMsg
        If Option1(0).Value = True Then
        .Fields("Emp_Flet") = 1
        Else
        .Fields("Emp_Flet") = 0
        End If
        If Text1(12) = 16 Then
            .Fields("TipoComp_Asoc") = 1
        Else
        End If
        .Fields("PtoVta_Asoc") = Text1(9)
        .Fields("Nro_Asoc") = Text1(10)
        .Fields("Fecha_Asoc") = Text1(11)
        .Update
    End With
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & lPrimaryKey
            Case 2: NRO = "000000" & lPrimaryKey
            Case 3: NRO = "00000" & lPrimaryKey
            Case 4: NRO = "0000" & lPrimaryKey
            Case 5: NRO = "000" & lPrimaryKey
            Case 6: NRO = "00" & lPrimaryKey
            Case 7: NRO = "0" & lPrimaryKey
            Case 8: NRO = lPrimaryKey
        End Select
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = FechaNC
        .Fields("Codigo") = Text1(1)
        .Fields("DescClie") = DescCliente
        .Fields("DirClie") = DirCliente
        .Fields("LocCLie") = LocCliente
        .Fields("CuitClie") = CuitClient
        .Fields("TipoFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNeto)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TNC)
        .Fields("CAE") = Me.NCFE.F1RespuestaDetalleCae
        .Fields("ObsCAE") = NCFE.F1RespuestaDetalleResultado
        DIA = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 7, 2)
        MES = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 5, 2)
        AÑO = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = NCFE.F1RespuestaDetalleResultado
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To CuerpoNC.ListItems.Count
        Set Cuerpo = CuerpoNC.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Fields("TipoComp") = 3
            .Fields("Alicuota") = Cuerpo.SubItems(1)
            .Fields("PtoVta") = 4
            .Update
        End With
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Update
        End With
    Next
    'GRABA FACTURA EN CTA CTE
    If Option1(0).Value = True Then
        Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
        With rsCtaCteEmp
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodEmp") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 17
            .Fields("Haber") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
        Set rsCtaCteEmp = Nothing
    Else
        Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
        With rsCtaCteProv
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodProv") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 17
            .Fields("Debe") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
        Set rsCtaCteProv = Nothing
    End If
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = Nothing
    'factura grabada correctamente
End Sub
Private Sub NC_Lp()
On Error Resume Next
    Dim DescCliente As String, CuitClient As String, DirCliente As String, LocCliente As String
    Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 90 order by NroFe")
    Set rsDetFact = db.OpenRecordset("DetFE")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    'busca número nota de credito
    If Not rsEncabFact.EOF Then
        rsEncabFact.MoveLast
        lPrimaryKey = rsEncabFact.Fields("NroFE") + 1
    Else
        lPrimaryKey = 1
    End If
    'lPrimaryKey = GetPrimaryKey
    VNro = lPrimaryKey
    'GENERA CAE
    'llena variables
    FVto = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FServD = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FservH = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FPago = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    VNetoFE = FormatNumber(TNeto)
    VivaFE = FormatNumber(TIVA)
    FCte = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    If Option1(0).Value = True Then
        Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(1) & "")
        VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        DescCliente = rsEmpresas!DescEmpresas
        CuitClient = rsEmpresas!cuit
        DirCliente = rsEmpresas!Direccion
        LocCliente = rsEmpresas!Localidad
    Else
        Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(1) & "")
        VCUIT = Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        DescCliente = rsFleteros!DescFlet
        CuitClient = rsFleteros!cuit
        DirCliente = rsFleteros!Direccion
        LocCliente = rsFleteros!Localidad
    End If
    VTipoDoc = 80
    VtipoComp = 90
    Set rsEncabFact = db.OpenRecordset("EncabFE")
    If rsEncabFact.EOF Then
        VIndice = 0
    Else
        rsEncabFact.MoveLast
        VIndice = rsEncabFact!indice + 1
    End If
    
    With rsEncabFact
        .AddNew
        .Fields("Indice") = VIndice
        .Fields("PtoVtaFE") = 4
        .Fields("NroFE") = lPrimaryKey
        .Fields("FechaFE") = FechaNC
        .Fields("CodClie") = Text1(1)
        .Fields("TotalNetoFE") = VNetoFE
        .Fields("TotalIvaFE") = VivaFE
        .Fields("TotalGralFE") = FormatNumber(TNC)
        .Fields("TipoAfip") = 90
        .Fields("TipoSistema") = 90
        .Fields("FVto") = FVto
        .Fields("FservD") = FServD
        .Fields("FservH") = FservH
        .Fields("FPago") = FPago
        .Fields("ClaseFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión, 3 - Nota de Credito
        Call genera_cae_nc_LP
        .Fields("CAE") = NCFE.F1RespuestaDetalleCae
        .Fields("VtoCAE") = NCFE.F1RespuestaDetalleCAEFchVto
        .Fields("ObsCAE") = NCFE.F1RespuestaDetalleResultado
        .Fields("MotivoCAE") = NCFE.F1RespuestaDetalleObservacionMsg
        .Fields("Emp_Flet") = Option1(0).Index
        .Update
    End With
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & lPrimaryKey
            Case 2: NRO = "000000" & lPrimaryKey
            Case 3: NRO = "00000" & lPrimaryKey
            Case 4: NRO = "0000" & lPrimaryKey
            Case 5: NRO = "000" & lPrimaryKey
            Case 6: NRO = "00" & lPrimaryKey
            Case 7: NRO = "0" & lPrimaryKey
            Case 8: NRO = lPrimaryKey
        End Select
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = FechaNC
        .Fields("Codigo") = Text1(1)
        .Fields("DescClie") = DescCliente
        .Fields("DirClie") = DirCliente
        .Fields("LocCLie") = LocCliente
        .Fields("CuitClie") = CuitClient
        .Fields("TipoFact") = 90 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNeto)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TNC)
        .Fields("CAE") = Me.NCFE.F1RespuestaDetalleCae
        .Fields("ObsCAE") = NCFE.F1RespuestaDetalleResultado
        DIA = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 7, 2)
        MES = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 5, 2)
        AÑO = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = NCFE.F1RespuestaDetalleResultado
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To CuerpoNC.ListItems.Count
        Set Cuerpo = CuerpoNC.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Fields("TipoComp") = 90
            .Fields("Alicuota") = Cuerpo.SubItems(1)
            .Update
        End With
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Update
        End With
    Next
    'GRABA FACTURA EN CTA CTE
    If Option1(0).Value = True Then
        Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
        With rsCtaCteEmp
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodEmp") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 90
            .Fields("Haber") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
        Set rsCtaCteEmp = Nothing
    Else
        Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
        With rsCtaCteProv
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodProv") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 90
            .Fields("Debe") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
        Set rsCtaCteProv = Nothing
    End If
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = Nothing
    'factura grabada correctamente

End Sub
Private Sub genera_cae_nc_LP()
If NCFE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   Me.NCFE.ArchivoCertificadoPassword = "hercasa1509"
   If NCFE.f1ObtenerTicketAcceso() Then
      NCFE.F1CabeceraCantReg = 1
      NCFE.F1CabeceraPtoVta = 4
      NCFE.F1CabeceraCbteTipo = 90
      
      NCFE.f1Indice = 0
      NCFE.F1DetalleConcepto = 2
      NCFE.F1DetalleDocTipo = VTipoDoc
      NCFE.F1DetalleDocNro = VCUIT
      NCFE.F1DetalleCbteDesde = VNro
      NCFE.F1DetalleCbteHasta = VNro
      NCFE.F1DetalleCbteFch = FCte
      NCFE.F1DetalleImpTotal = FormatNumber(TNC)
      NCFE.F1DetalleImpTotalConc = 0
      NCFE.F1DetalleImpNeto = FormatNumber(TNeto)
      NCFE.F1DetalleImpOpEx = 0
      NCFE.F1DetalleImpTrib = 0
      NCFE.F1DetalleImpIva = FormatNumber(TIVA)
      NCFE.F1DetalleFchServDesde = FServD
      NCFE.F1DetalleFchServHasta = FservH
      NCFE.F1DetalleFchVtoPago = FPago
      NCFE.F1DetalleMonIdS = "PES"
      NCFE.F1DetalleMonCotiz = 1
      NCFE.F1DetalleIvaItemCantidad = 1
      NCFE.f1IndiceItem = 0
      
  
     
    If TIVA = 0 Then
            NCFE.F1DetalleIvaId = 3
            NCFE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NCFE.F1DetalleIvaImporte = FormatNumber(TIVA)
     Else
            NCFE.F1DetalleIvaId = 5
            NCFE.F1DetalleIvaBaseImp = FormatNumber(TNeto)
            NCFE.F1DetalleIvaImporte = FormatNumber(TIVA)
    End If
    


      NCFE.F1DetalleCbtesAsocItemCantidad = 0
      NCFE.F1DetalleOpcionalItemCantidad = 0

      NCFE.ArchivoXMLRecibido = "C:\XML\recibido.xml"
      NCFE.ArchivoXMLEnviado = "c:\XML\enviado.xml"

      lResultado = NCFE.F1CAESolicitar()
      
     If lResultado Then
         MsgBox ("NOTA DE CREDITO Generada")
      Else
         MsgBox ("Error de Solicitud de CAE")
      End If
      'MsgBox ("error local: " + ncfe.UltimoMensajeError)
      'MsgBox ("resultado global AFIP: " + ncfe.F1RespuestaResultado)
      'MsgBox ("es reproceso? " + ncfe.F1RespuestaReProceso)
      'MsgBox ("registros procesados por AFIP: " + Str(ncfe.F1RespuestaCantidadReg))
      'MsgBox ("error genérico global:" + ncfe.f1ErrorMsg1)
      If NCFE.F1RespuestaCantidadReg > 0 Then
        'ncfe.f1Indice = 0
        'MsgBox ("resultado detallado comprobante: " + ncfe.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + ncfe.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + ncfe.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + ncfe.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + NCFE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + NCFE.UltimoMensajeError)
End If

End Sub
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFact
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroFact") + 1
            
        Else
            
            GetPrimaryKey = 1
        End If
        
    End With
End Function
Private Function GetPrimaryKeyCta()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFactCta
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroFact") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function

Private Sub Aceptar_Click()
On Error Resume Next
Dim lPrimaryKey As Long
If Text1(10) = "" Or Text1(9) = "" Then
    MsgBox " El campo nro de comprobate a aplicar es obligatorio"
    Exit Sub
End If
If TipoComp.ListIndex = 1 Then
   Call GENERA_NC_CTA
End If
If TipoComp.ListIndex = 0 Then
    Call GENERA_NC1
    'Dim frmRep As New InfNC_FE
    'frmRep.Show vbModal
End If
If TipoComp.ListIndex = 2 Then
    Call NC_Pyme
    'Dim frmRep1 As New InfNC_FEP
   ' frmRep1.Show vbModal
End If
If TipoComp.ListIndex = 3 Then
    Call NC_Lp
    Dim frmRep2 As New InfNC_LP
    frmRep2.Show vbModal
End If
Call Form_Load
End Sub
Private Sub NC_Pyme()
On Error Resume Next
    Dim DescCliente As String, CuitClient As String, DirCliente As String, LocCliente As String
    Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 203 order by NroFe")
    Set rsDetFact = db.OpenRecordset("DetFE")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    'busca número nota de credito
    
        lPrimaryKey = Text2(1)
        'lPrimaryKey = GetPrimaryKey
    VNro = lPrimaryKey
    'GENERA CAE
    'llena variables
    FVto = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FServD = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FservH = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    FPago = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    VNetoFE = FormatNumber(TNeto)
    VivaFE = FormatNumber(TIVA)
    FCte = Mid(FechaNC, 7, 4) & Mid(FechaNC, 4, 2) & Mid(FechaNC, 1, 2)
    If Option1(0).Value = True Then
        Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(1) & "")
        VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
        DescCliente = rsEmpresas!DescEmpresas
        CuitClient = rsEmpresas!cuit
        DirCliente = rsEmpresas!Direccion
        LocCliente = rsEmpresas!Localidad
    Else
        Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(1) & "")
        VCUIT = Mid(rsFleteros!cuit, 1, 2) & Mid(rsFleteros!cuit, 4, 8) & Mid(rsFleteros!cuit, 13, 1)
        DescCliente = rsFleteros!DescFlet
        CuitClient = rsFleteros!cuit
        DirCliente = rsFleteros!Direccion
        LocCliente = rsFleteros!Localidad
    End If
    VTipoDoc = 80
    VtipoComp = 203
    Set rsEncabFact = db.OpenRecordset("EncabFE")
    If rsEncabFact.EOF Then
        VIndice = 0
    Else
        rsEncabFact.MoveLast
        VIndice = rsEncabFact!indice + 1
    End If
    
    With rsEncabFact
        .AddNew
        .Fields("Indice") = VIndice
        .Fields("PtoVtaFE") = 4
        .Fields("NroFE") = lPrimaryKey
        .Fields("FechaFE") = FechaNC
        .Fields("CodClie") = Text1(1)
        .Fields("TotalNetoFE") = VNetoFE
        .Fields("TotalIvaFE") = VivaFE
        .Fields("TotalGralFE") = FormatNumber(TNC)
        .Fields("TipoAfip") = 3
        .Fields("TipoSistema") = 203
        .Fields("FVto") = FVto
        .Fields("FservD") = FServD
        .Fields("FservH") = FservH
        .Fields("FPago") = FPago
        .Fields("ClaseFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión, 3 - Nota de Credito
        .Fields("TipoComp_Asoc") = Text1(12)
        .Fields("PtoVta_Asoc") = Text1(9)
        .Fields("Nro_Asoc") = Text1(10)
        .Fields("Fecha_Asoc") = Text1(11)
        If Option2(0).Value = True Then
        .Fields("Motivo_Asoc") = "S"
        Else
        .Fields("Motivo_Asoc") = "N"
        End If
        
        'Call GeneraCAE_Pyme
        'If NCFE.F1RespuestaDetalleResultado = "R" Then
         '   MsgBox "Comprobate Rechazado"
         '   Exit Sub
        'End If
'        .Fields("CAE") = NCFE.F1RespuestaDetalleCae
 '       .Fields("VtoCAE") = NCFE.F1RespuestaDetalleCAEFchVto
  '      .Fields("ObsCAE") = NCFE.F1RespuestaDetalleResultado
   '     .Fields("MotivoCAE") = NCFE.F1RespuestaDetalleObservacionMsg
        .Fields("Emp_Flet") = Option1(0).Index
        .Update
    End With
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & lPrimaryKey
            Case 2: NRO = "000000" & lPrimaryKey
            Case 3: NRO = "00000" & lPrimaryKey
            Case 4: NRO = "0000" & lPrimaryKey
            Case 5: NRO = "000" & lPrimaryKey
            Case 6: NRO = "00" & lPrimaryKey
            Case 7: NRO = "0" & lPrimaryKey
            Case 8: NRO = lPrimaryKey
        End Select
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = FechaNC
        .Fields("Codigo") = Text1(1)
        .Fields("DescClie") = DescCliente
        .Fields("DirClie") = DirCliente
        .Fields("LocCLie") = LocCliente
        .Fields("CuitClie") = CuitClient
        .Fields("TipoFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNeto)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TNC)
        '.Fields("CAE") = Me.NCFE.F1RespuestaDetalleCae
        '.Fields("ObsCAE") = NCFE.F1RespuestaDetalleResultado
        'DIA = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 7, 2)
        'MES = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 5, 2)
        'AÑO = Mid(NCFE.F1RespuestaDetalleCAEFchVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
'        .Fields("MotivoCAE") = NCFE.F1RespuestaDetalleResultado
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To CuerpoNC.ListItems.Count
        Set Cuerpo = CuerpoNC.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Fields("TipoComp") = 203
            .Fields("Alicuota") = Cuerpo.SubItems(1)
            .Fields("PtoVta") = 4
            .Update
        End With
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("ConceptoNC") = Mid(Cuerpo.Tag, 1, 200)
            .Fields("STotal") = Cuerpo.SubItems(2)
            .Update
        End With
    Next
    'GRABA FACTURA EN CTA CTE
    If Option1(0).Value = True Then
        Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
        With rsCtaCteEmp
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodEmp") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 203
            .Fields("Haber") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
        Set rsCtaCteEmp = Nothing
    Else
        Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
        With rsCtaCteProv
            .AddNew
            .Fields("Fecha") = FechaNC
            .Fields("CodProv") = Text1(1)
            .Fields("PtoVta") = 4
            .Fields("NroComp") = lPrimaryKey
            .Fields("TipoComp") = 203
            .Fields("Debe") = FormatNumber(TNC)
            .Fields("SaldoComp") = FormatNumber(TNC)
            .Update
        End With
        Set rsCtaCteProv = Nothing
    End If
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = Nothing
    'factura grabada correctamente

End Sub
Private Sub AgregarCHP_Click()
If IsNumeric(Text1(4)) = True And IsNumeric(Text1(5)) = True Then
    Set Cuerpo = CuerpoNC.ListItems.Add(, , Text1(3))
    Cuerpo.Tag = Text1(3)
    Cuerpo.SubItems(1) = Text1(4)
    Cuerpo.SubItems(2) = Text1(5)
    TNeto = TNeto + Text1(5)
    TIVA = TIVA + Text1(5) * Text1(4) / 100
    TNC = TNeto + TIVA
    Text1(6) = FormatNumber(TNeto)
    Text1(7) = FormatNumber(TIVA)
    Text1(8) = FormatNumber(TNC)
    Text1(3) = ""
    Text1(4) = ""
    Text1(5) = ""
    Text1(3).SetFocus
Else
    MsgBox "Unos de los campos no es numerico", vbInformation
End If
End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text1.Count
    Text1(i - 1) = ""
Next
i = 0
For i = i + 1 To Text2.Count
    Text2(i - 1) = ""
Next
Text1(6) = "0.00"
Text1(7) = "0.00"
Text1(8) = "0.00"
FechaNC.Mask = ""
FechaNC.Text = ""
FechaNC.Mask = "##/##/####"
FechaNC = Date
TipoComp.AddItem "A"
TipoComp.AddItem "Cta y Orden"
TipoComp.AddItem "Pyme"
TipoComp.AddItem "Nota Credito Liq Prod"
TipoComp.ListIndex = 0
CuerpoNC.ListItems.Clear
Option2(0).Visible = False
Option2(2).Visible = False
Label1(12) = ""
TNeto = 0
TIVA = 0
TNC = 0

End Sub

Private Sub Text1_Change(Index As Integer)
Select Case Index:
Case 3:
i = 0
i = Len(Text1(3))
If Not i < 250 Then
    MsgBox "El campo debe tener 250 caracteres", vbInformation
    Text1(3) = Mid(Text1(3), 1, 250)
End If
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
    Case 1:
        If Not Text1(1) = "" Then
            If Option1(0).Value = True Then
                Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(1) & "")
                If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                    Text1(2) = rsEmpresas!DescEmpresas
                Else
                    MsgBox "La empresa no existe", vbInformation
                End If
                Set rsEmpresas = Nothing
            Else
                Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(1) & "")
                If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                    Text1(2) = rsFleteros!DescFlet
                Else
                    MsgBox "El Fletero no existe", vbInformation
                End If
                Set rsFleteros = Nothing
            End If
        End If
    Case 10:
        If Text1(12) = 16 Then
            Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where TipoSistema = " & Text1(12) & " and CodClie = " & Text1(1) & " and PtoVtaFE = " & Text1(9) & " and NroFE = " & Text1(10) & "")
        ElseIf Text1(12) = 60 Then
            Set rsEncabFact = db.OpenRecordset("Select * From EncabLProd Where TipoSistema = " & Text1(12) & " and CodFlet = " & Text1(1) & " and PtoVta = " & Text1(9) & " and NroComp = " & Text1(10) & "")
        ElseIf Text1(12) = 201 Then
            Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where TipoSistema = " & Text1(12) & " and CodClie = " & Text1(1) & " and PtoVtaFE = " & Text1(9) & " and NroFE = " & Text1(10) & "")
        End If
        If rsEncabFact.EOF Then
            MsgBox "El comprobante no existe"
            Exit Sub
        Else
            Text1(11) = rsEncabFact!FechaFE
        End If
End Select

End Sub

Private Sub TipoComp_LostFocus()
If TipoComp.ListIndex = 2 Then
    Label1(12) = "Factura MyPyme"
    Option2(0).Visible = True
    Option2(2).Visible = True
    Text1(12) = 201
End If
If TipoComp.ListIndex = 0 Then
    Label1(12) = "FacT. Electronica"
    Text1(12) = 16
End If

End Sub

