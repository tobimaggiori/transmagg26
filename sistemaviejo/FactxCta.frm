VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form FactxCta 
   BackColor       =   &H80000007&
   Caption         =   "Facturación por Cuenta y Orden"
   ClientHeight    =   10350
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   12900
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   10350
   ScaleWidth      =   12900
   Begin VB.ComboBox TipoComp 
      Height          =   315
      Left            =   1560
      TabIndex        =   20
      Text            =   "Combo1"
      Top             =   120
      Width           =   1935
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   6
      Left            =   10680
      TabIndex        =   19
      Text            =   "Text1"
      Top             =   9720
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   5
      Left            =   10680
      TabIndex        =   18
      Text            =   "Text1"
      Top             =   9240
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   4
      Left            =   10680
      TabIndex        =   17
      Text            =   "Text1"
      Top             =   8760
      Width           =   1695
   End
   Begin VB.Frame ViajesFact 
      BackColor       =   &H80000007&
      Caption         =   "Viajes a Facturar"
      ForeColor       =   &H000040C0&
      Height          =   3255
      Left            =   120
      TabIndex        =   10
      Top             =   4920
      Width           =   12615
      Begin MSComctlLib.ListView LViajesFact 
         Height          =   2775
         Left            =   120
         TabIndex        =   11
         Top             =   360
         Width           =   12195
         _ExtentX        =   21511
         _ExtentY        =   4895
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
         NumItems        =   15
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Rem"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Mercaderia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Procedencia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Destino"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Kilos"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   9
            Text            =   "CodFlet"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   10
            Text            =   "Fletero"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   11
            Text            =   "CodEmpresa"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   12
            Text            =   "CodChofer"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(14) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   13
            Text            =   "Facturado"
            Object.Width           =   265
         EndProperty
         BeginProperty ColumnHeader(15) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   14
            Text            =   "NroViaje"
            Object.Width           =   2540
         EndProperty
      End
   End
   Begin VB.Frame ViajesPend 
      BackColor       =   &H80000007&
      Caption         =   "Viajes Pendientes"
      ForeColor       =   &H000040C0&
      Height          =   3255
      Left            =   120
      TabIndex        =   8
      Top             =   1440
      Width           =   12615
      Begin MSComctlLib.ListView ListaViajes 
         Height          =   2775
         Left            =   120
         TabIndex        =   9
         Top             =   240
         Width           =   12195
         _ExtentX        =   21511
         _ExtentY        =   4895
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
         NumItems        =   14
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Rem"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Mercaderia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Procedencia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Destino"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Kilos"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   9
            Text            =   "CodFlet"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   10
            Text            =   "Fletero"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   11
            Text            =   "CodEmpresa"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   12
            Text            =   "CodChofer"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(14) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   13
            Text            =   "NroViaje"
            Object.Width           =   2540
         EndProperty
      End
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   2280
      TabIndex        =   7
      Text            =   "Text1"
      Top             =   960
      Width           =   4215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   1560
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   960
      Width           =   615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2280
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   600
      Width           =   4215
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1560
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   600
      Width           =   615
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   5160
      TabIndex        =   3
      Top             =   120
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   735
      Left            =   2520
      TabIndex        =   12
      Top             =   8880
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Aceptar"
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
      MICON           =   "FactxCta.frx":0000
      PICN            =   "FactxCta.frx":001C
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
      Height          =   735
      Left            =   4680
      TabIndex        =   13
      Top             =   8880
      Width           =   2055
      _ExtentX        =   3625
      _ExtentY        =   1296
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
      MICON           =   "FactxCta.frx":209E
      PICN            =   "FactxCta.frx":20BA
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
      Caption         =   "Tipo Comp."
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
      Height          =   285
      Index           =   0
      Left            =   240
      TabIndex        =   21
      Top             =   120
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Sub Total"
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
      Left            =   8760
      TabIndex        =   16
      Top             =   8760
      Width           =   1455
   End
   Begin VB.Label Label1 
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
      Index           =   4
      Left            =   8760
      TabIndex        =   15
      Top             =   9240
      Width           =   1455
   End
   Begin VB.Label Label1 
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
      Index           =   5
      Left            =   8760
      TabIndex        =   14
      Top             =   9720
      Width           =   1455
   End
   Begin VB.Shape Shape1 
      BorderColor     =   &H000040C0&
      BorderWidth     =   2
      FillColor       =   &H000040C0&
      Height          =   1575
      Left            =   8160
      Top             =   8520
      Width           =   4575
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa"
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
      Height          =   285
      Index           =   3
      Left            =   240
      TabIndex        =   2
      Top             =   960
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fletero"
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
      Height          =   285
      Index           =   2
      Left            =   240
      TabIndex        =   1
      Top             =   600
      Width           =   1455
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
      Index           =   1
      Left            =   3840
      TabIndex        =   0
      Top             =   120
      Width           =   1455
   End
End
Attribute VB_Name = "FactxCta"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Function GetPrimaryKey()
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
Dim lPrimaryKey As Long
Dim sMessage As String
If TipoComp.ListIndex = 0 Then
    Set rsEncabFactCta = db.OpenRecordset("Select * From EncabFactCta Order By NroFact")
    Set rsDetFactCta = db.OpenRecordset("DetFactCta")
    lPrimaryKey = GetPrimaryKey
    'graba encabezado
    With rsEncabFactCta
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(2)
        .Fields("TipoFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNetoFact)
        .Fields("TIVA") = FormatNumber(TIVAFact)
        .Fields("TGral") = FormatNumber(TFact)
        '.Fields("CodFlet") = Text1(0)
        .Update
    End With
    'graba detalle
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With rsDetFactCta
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Fields("CodFlet") = Lista.SubItems(9)
            .Fields("Alicuota") = 21
            .Update
        End With
            Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Where NroViaje = " & Lista.SubItems(14) & "")
            rsLiqDetViajes.Edit
            rsLiqDetViajes.LockEdits = True
            rsLiqDetViajes.Fields("Facturado") = "SI"
            rsLiqDetViajes.Update
            rsLiqDetViajes.LockEdits = False
            
            Set rsViajesFact = db.OpenRecordset("Select * From ViajesFactura Where NroViaje = " & Lista.SubItems(14) & "")
            rsViajesFact.Edit
            rsViajesFact.LockEdits = True
            rsViajesFact.Fields("Facturado") = "SI"
            rsViajesFact.Update
            rsViajesFact.LockEdits = False
    Next
    'GRABA FACTURA EN CTA CTE
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1(2)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 13
        .Fields("Debe") = FormatNumber(TFact)
        .Fields("SaldoComp") = FormatNumber(TFact)
        .Update
    End With
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = Nothing
    Set rsCtaCteEmp = Nothing
Else
    'nota de credito
    Set rsEncabFactCta = db.OpenRecordset("EncabFactCta")
    Set rsDetFactCta = db.OpenRecordset("DetFactCta")
    lPrimaryKey = GetPrimaryKey
    'graba encabezado
    With rsEncabFactCta
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(2)
        .Fields("TipoFact") = 4 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNetoFact)
        .Fields("TIVA") = FormatNumber(TIVAFact)
        .Fields("TGral") = FormatNumber(TFact)
        '.Fields("CodFlet") = Text1(0)
        .Update
    End With
    'graba detalle
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With rsDetFactCta
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Fields("CodFlet") = Lista.SubItems(9)
            .Fields("Alicuota") = 21
            .Update
        End With
        If Lista.SubItems(13) = "SI" Then
            Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Where NroViaje = " & Lista.SubItems(14) & "")
            rsLiqDetViajes.Edit
            rsLiqDetViajes.LockEdits = True
            rsLiqDetViajes.Fields("Facturado") = "SI"
            rsLiqDetViajes.Update
            rsLiqDetViajes.LockEdits = False
        End If
    Next
    'GRABA FACTURA EN CTA CTE
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1(2)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 14
        .Fields("Haber") = FormatNumber(TFact)
        .Fields("SaldoComp") = FormatNumber(TFact)
        .Update
    End With
    Set rsEncabFactCta = Nothing
    Set rsDetFactCta = Nothing
    Set rsCtaCteEmp = Nothing
End If
    Call Form_Load
    MsgBox "El Comprobante se grabo correctamente con el nro: " & lPrimaryKey
    Call Imprime_FactCta(lPrimaryKey)
End Sub

Private Sub BuscarEmpresa()
 With BuscEmpresas
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "FactCta"
    End With
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call BuscarEmpresa
End Select
End Sub

Private Sub Form_Load()
i = 0
For i = i + 1 To Text1.Count
    If i >= 5 Then
        Text1(i - 1) = "0.00"
    Else
        Text1(i - 1) = ""
    End If
Next
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
Fecha = Date
TipoComp.AddItem ("Fact Cta y Orden")
TipoComp.AddItem ("NC Cta y Orden")
TipoComp.ListIndex = 0
ListaViajes.ListItems.Clear
LViajesFact.ListItems.Clear
TNetoFact = 0
TIVAFact = 0
TFact = 0
End Sub

Private Sub ListaViajes_DblClick()
Dim LViajes As ListItem
Dim ret As VbMsgBoxResult
On Error Resume Next
Set Lista = ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index)
Set LViajes = LViajesFact.ListItems.Add(, , Lista.Tag)
    LViajes.Tag = Lista.Tag: LViajes.SubItems(1) = Lista.SubItems(1): LViajes.SubItems(2) = Lista.SubItems(2)
    LViajes.SubItems(3) = Lista.SubItems(3): LViajes.SubItems(4) = Lista.SubItems(4): LViajes.SubItems(5) = Lista.SubItems(5)
    LViajes.SubItems(6) = Lista.SubItems(6): LViajes.SubItems(7) = Lista.SubItems(7): LViajes.SubItems(8) = Lista.SubItems(8)
    LViajes.SubItems(9) = Lista.SubItems(9): LViajes.SubItems(10) = Lista.SubItems(10)
    LViajes.SubItems(11) = Lista.SubItems(11): LViajes.SubItems(12) = Lista.SubItems(12)
    TNetoFact = TNetoFact + Lista.SubItems(8): LViajes.SubItems(14) = Lista.SubItems(13)
    TIVAFact = TNetoFact * 21 / 100
    TFact = TNetoFact + TIVAFact
    Text1(4) = FormatNumber(TNetoFact)
    Text1(5) = FormatNumber(TIVAFact)
    Text1(6) = FormatNumber(TFact)
    LViajes.SubItems(13) = "SI"
    ListaViajes.ListItems.Remove (ListaViajes.SelectedItem.Index)
End Sub

Private Sub Text1_LostFocus(Index As Integer)
On Error Resume Next
Select Case Index
    'Case 2:
     '   If Not Text1(0) = "" Then
     '   Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(0) & "")
     '   If Not rsFleteros.EOF And Not rsFleteros.BOF Then
      '      Text1(1) = rsFleteros!DescFlet
      '  Else
      '      MsgBox "El Fletero no existe", vbInformation
      '  End If
      '  Set rsFleteros = Nothing
      '  End If
      Case 2:
        If Not Text1(2) = "" Then
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(2) & "")
        If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
            Text1(3) = rsEmpresas!DescEmpresas
                Set rsViajesFact = db.OpenRecordset("SELECT * FROM ViajesFactura WHERE CodEmpresa = " & Text1(2) & " ORDER BY Fecha")
                If Not rsViajesFact.EOF And Not rsViajesFact.BOF Then
                    ListaViajes.ListItems.Clear
                    Do While Not rsViajesFact.EOF
                        If rsViajesFact!Facturado = "NO" Then
                        Set Lista = ListaViajes.ListItems.Add(, , rsViajesFact!Fecha)
                        Lista.Tag = rsViajesFact!Fecha
                        Lista.SubItems(1) = rsViajesFact!NroRemito
                    Lista.SubItems(2) = rsViajesFact!DescChofer
                        Lista.SubItems(3) = rsViajesFact!Mercaderia
                        Lista.SubItems(4) = rsViajesFact!Procedencia
                        Lista.SubItems(5) = rsViajesFact!Destino
                        Lista.SubItems(6) = FormatNumber(rsViajesFact!kilos)
                        Lista.SubItems(7) = FormatNumber(rsViajesFact!tarifa)
                        Lista.SubItems(8) = FormatNumber(rsViajesFact!Subtotal)
                        Lista.SubItems(9) = rsViajesFact!CodFlet
                        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsViajesFact!CodFlet & "")
                        Lista.SubItems(10) = rsFleteros!DescFlet
                        Set rsFleteros = Nothing
                        Lista.SubItems(11) = rsViajesFact!CodEmpresa
                        Lista.SubItems(12) = rsViajesFact!CodChofer
                        Lista.SubItems(13) = rsViajesFact!NroViaje
                        End If
                        rsViajesFact.MoveNext
                    Loop
                Else
                    MsgBox "No Hay Viajes para Facturar", vbInformation
                End If
                Set rsViajesFact = Nothing
        End If
        End If
End Select
End Sub
